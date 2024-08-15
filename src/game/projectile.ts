import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { CAMERA_MIN_Y } from "./constants.js";


const DEATH_TIME : number = 10;


export class Projectile extends GameObject {


    private id : number = 0;
    private friendly : boolean = true;

    private animationTimer : number = 0;
    private deathTimer : number = 0.0;
    

    constructor() {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 4, 4);
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.dying = true;
        this.deathTimer = 0.0;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const ANIMATION_SPEED : number = 1.0/12.0;

        if (this.pos.x - 8 > event.screenWidth || this.pos.x + 8 < 0 ||
            this.pos.y + 8 < CAMERA_MIN_Y) {

            this.exist = false;
            // console.log("Poof!");
        }

        if (this.id == 1) {

            this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.tick) % 1.0;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = this.deathTimer/DEATH_TIME;
            const r1 : number = (1 + t)*(6 + this.id*2);
            const r2 : number = (11 + 4*this.id)*t;

            canvas.setColor("#ffdbff");
            canvas.fillRing(this.pos.x, this.pos.y, r2, r1);
            return;
        }

        canvas.drawBitmap(bmp, Flip.None, 
            this.pos.x - 8, this.pos.y - 8, 
            ((this.animationTimer*4) | 0)*16, this.id*16, 16, 16);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number, friendly : boolean = true) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
        this.target = this.speed.clone();

        this.id = id;
        this.friendly = friendly;

        this.dying = false;
        this.exist = true;

        this.animationTimer = 0;
    }
}
