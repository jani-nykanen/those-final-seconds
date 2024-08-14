import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { clamp } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { GROUND_LEVEL } from "./background.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { next } from "./existingobject.js";
import { GameObject, updateSpeedAxis } from "./gameobject.js";
import { GasParticle } from "./gasparticle.js";


const ANGLE_MAX : number = 4.0;


export class Player extends GameObject {


    private angle : number = 0.0;
    private angleTarget : number = 0.0;

    private gasSupply : GasParticle[];
    private gasTimer : number = 0.0;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 2, 24, 16);

        this.friction = new Vector(0.15, 0.15);
    
        this.gasSupply = new Array<GasParticle> ();
    }


    private control(event : ProgramEvent) : void {

        const MOVE_SPEED : number = 2.0;
        const dir : Vector = new Vector();

        if ((event.input.getAction("l") & InputState.DownOrPressed) != 0) {

            dir.x = -1;
        }
        else if ((event.input.getAction("r") & InputState.DownOrPressed) != 0) {

            dir.x = 1;
        }

        if ((event.input.getAction("u") & InputState.DownOrPressed) != 0) {

            dir.y = -1;
        }
        else if ((event.input.getAction("d") & InputState.DownOrPressed) != 0) {

            dir.y = 1;
        }
        dir.normalize();

        this.target.x = dir.x*MOVE_SPEED;
        this.target.y = dir.y*MOVE_SPEED;

        this.angleTarget = dir.y*ANGLE_MAX;
    }


    private checkBorders(event : ProgramEvent) : void {

        const left : number = this.hitbox.x + this.hitbox.w/2;
        const right : number = event.screenWidth - this.hitbox.w/2 + this.hitbox.x;
        const top : number = CAMERA_MIN_Y + this.hitbox.y + this.hitbox.h/2;

        if ((this.speed.x < 0 && this.pos.x <= left) || (this.speed.x > 0 && this.pos.x >= right)) {

            this.speed.x = 0;
        }
        this.pos.x = clamp(this.pos.x, left, right);

        if (this.speed.y < 0 && this.pos.y < top) {

            this.speed.y = 0;
            this.pos.y = top;

            this.angleTarget = 0.0;
        }
    }


    private updateGas(event : ProgramEvent) : void {

        const GAS_TIME : number = 6.0;

        for (let o of this.gasSupply) {

            o.update(event);
        }

        if ((this.gasTimer -= event.tick) <= 0) {

            this.gasTimer += GAS_TIME;

            let o : GasParticle | undefined = next<GasParticle> (this.gasSupply);
            if (o === undefined) {

                o = new GasParticle();
                this.gasSupply.push(o);
            }
            o.spawn(this.pos.x - 16, this.pos.y + 4, -2.0 + this.speed.x, this.speed.y/2, 1.0/32.0, 0);
        }
    }


    protected updateEvent(event : ProgramEvent) : void {

        this.control(event);
        this.updateGas(event);
    }


    protected postMovementEvent(event : ProgramEvent) : void {
        
        const ANGLE_FRICTION : number = 0.25;

        this.checkBorders(event);
        this.angle = updateSpeedAxis(this.angle, this.angleTarget, ANGLE_FRICTION*event.tick);
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.angleTarget = 0.0
    }


    public preDraw(canvas : Canvas) : void {

        const bmpGasParticle : Bitmap = canvas.getBitmap("gp");
        for (let o of this.gasSupply) {

            o.draw(canvas, bmpGasParticle);
        }
    }


    public draw(canvas : Canvas) : void {
        
        const dx : number = this.pos.x - 16;
        const dy : number = this.pos.y - 12;

        const angleStep : number = Math.round(this.angle);
        const angleRamp : number = (32/(1.0 + Math.abs(angleStep))) | 0;
        const dir : number = Math.sign(angleStep);
        const shifty : number = -(dir < 0 ? Math.floor : Math.ceil)(angleStep/2);

        const bmp : Bitmap = canvas.getBitmap("p");
        let y : number = 0;
        for (let x : number = 0; x < 32; x += angleRamp) {
            
            y += Math.sign(angleStep);

            canvas.drawBitmap(bmp, Flip.None, dx + x, dy + shifty + y, x, 0, angleRamp, 24);
        }
    }


    // TODO: Make a common method for all objects
    public drawShadow(canvas: Canvas) : void {

        const dx : number = this.pos.x;
        const dy : number = canvas.height - GROUND_LEVEL;

        const shadowSize : number = 16 + 20*(Math.min(this.pos.y, dy)/canvas.height);

        canvas.fillEllipse(dx, dy, shadowSize/2, shadowSize/6);
    }
}
