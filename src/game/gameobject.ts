import { ExistingObject } from "./existingobject.js";
import { Vector } from "../math/vector.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { GROUND_LEVEL } from "./background.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {

    if (speed < target) {

        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
}


export class GameObject implements ExistingObject {


    protected exist : boolean = true;
    protected dying : boolean = false;

    protected pos : Vector;

    protected speed : Vector;
    protected target : Vector;
    protected friction : Vector;

    protected hitbox : Rectangle;

    protected shadowWidth : number = 16;


    constructor(x : number = 0, y : number = 0, exist : boolean = false) {

        this.pos = new Vector(x, y);

        this.speed = new Vector();
        this.target = new Vector();
        this.friction = new Vector(1, 1);

        this.hitbox = new Rectangle(0, 0, 16, 16)

        this.exist = exist;
    }


    private checkGroundCollision(event : ProgramEvent) : void {

        const ground : number = event.screenHeight - GROUND_LEVEL;
        if (this.speed.y > 0 && this.pos.y + this.hitbox.y + this.hitbox.h/2 > ground) {

            this.pos.y = ground - this.hitbox.y - this.hitbox.h/2;
            this.speed.y = 0.0;

            this.groundCollisionEvent?.(event);
        }
    }


    protected updateEvent?(event : ProgramEvent) : void;
    protected postMovementEvent?(event : ProgramEvent) : void;
    protected groundCollisionEvent?(event : ProgramEvent) : void;
    protected die?(event : ProgramEvent) : boolean;


    protected updateMovement(event : ProgramEvent) : void {

        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x*event.tick);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y*event.tick);

        this.pos.x += this.speed.x*event.tick;
        this.pos.y += this.speed.y*event.tick;
    }


    public update(event : ProgramEvent) : void {

        if (!this.exist) 
            return;

        if (this.dying) {

            if (this.die?.(event) ?? true) {

                this.exist = false;
                this.dying = false;
            }
            return;
        }

        this.updateEvent?.(event);
        this.updateMovement(event);
        this.checkGroundCollision(event);
        this.postMovementEvent?.(event);
    }


    public drawShadow(canvas: Canvas) : void {

        if (!this.isActive()) {

            return;
        }

        const dx : number = this.pos.x;
        const dy : number = canvas.height - GROUND_LEVEL;

        // 20 here is a magic number coming out of nowhere...
        const shadowSize : number = this.shadowWidth + 20*(Math.min(this.pos.y, dy)/canvas.height);

        canvas.fillEllipse(dx, dy, shadowSize/2, shadowSize/6);
    }

    
    public doesExist = () : boolean => this.exist;
    public isDying = () : boolean => this.dying;
    public isActive = () : boolean => this.exist && !this.dying;

    public getPosition = () : Vector => this.pos.clone();
    public getSpeed = () : Vector => this.speed.clone();
    public getHitbox = () : Rectangle => this.hitbox.clone();

    public overlayRect = (target : Rectangle) : boolean => Rectangle.overlay(this.hitbox, target, this.pos);
    public overlay = (o : GameObject) : boolean => Rectangle.overlay(this.hitbox, o.hitbox, this.pos, o.pos);


    public forceKill() : void {
        
        this.exist = false;
        this.dying = false;
    }
}
