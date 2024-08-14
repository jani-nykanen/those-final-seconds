import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { GROUND_LEVEL } from "./background.js";
import { GameObject, updateSpeedAxis } from "./gameobject.js";


const ANGLE_MAX : number = 4.0;


export class Player extends GameObject {


    private angle : number = 0.0;
    private angleTarget : number = 0.0;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 16, 24, 16);

        this.friction = new Vector(0.15, 0.15);
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


    protected updateEvent(event : ProgramEvent) : void {

        const ANGLE_FRICTION : number = 0.25;

        this.control(event);

        this.angle = updateSpeedAxis(this.angle, this.angleTarget, ANGLE_FRICTION*event.tick);
    }


    public draw(canvas : Canvas) : void {
        
        const dx : number = Math.round(this.pos.x) - 16;
        const dy : number = Math.round(this.pos.y) - 12;

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

        const dx : number = Math.round(this.pos.x);
        const dy : number = canvas.height - GROUND_LEVEL;

        const shadowSize : number = 16 + 20*(Math.min(this.pos.y, dy)/canvas.height);

        canvas.fillEllipse(dx, dy, shadowSize/2, shadowSize/6);
    }
}
