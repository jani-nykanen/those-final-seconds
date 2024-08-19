import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";


const DEATH_TIME : number = 10;
const GRAVITY : number = 3.0;
const BASE_SPEED : number = 1.5;


export class Collectible extends GameObject {


    private id : number = 0;
    private deathTimer : number = 0.0;
    private animationTimer : number = 0.0;


    constructor() {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 2, 12, 12);

        this.friction.x = 0.05;
        this.friction.y = 0.075;

        this.bounceFactor = 1.15;

        this.shadowWidth = 4;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        const MIN_SPEED : number = -2.0;

        this.speed.y = Math.min(MIN_SPEED, this.speed.y);
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const ANIMATION_SPEED : number = 1.0/64.0;

        if (this.pos.x + 8 < 0) {

            this.exist = false;
            console.log("Poof!");
        }
        this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.tick) % 1.0;
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = this.deathTimer/DEATH_TIME;
            canvas.drawBitmap("r1", Flip.None, this.pos.x - 12, this.pos.y - 12, ((t*4) | 0)*24, 48 + this.id*24, 24, 24);
            return;
        }
        
        canvas.drawBitmap(bmp, Flip.None, this.pos.x - 8, this.pos.y - 8, ((this.animationTimer*8) | 0)*16, 0, 16, 16);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
        this.target.x = -BASE_SPEED;
        this.target.y = GRAVITY;

        this.id = id;

        this.dying = false;
        this.exist = true;
    }


    public kill(event : ProgramEvent) : void {

        this.dying = true;
        this.deathTimer = 0.0;
    }
}
