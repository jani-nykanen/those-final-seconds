import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";


const DEATH_TIME : number = 16;


export class Projectile extends GameObject {


    private id : number = 0;
    private friendly : boolean = true;

    private deathTimer : number = 0.0;
    

    constructor() {

        super(0, 0, false);
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.dying = true;
        this.deathTimer = 0.0;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        if (this.pos.x - 8 > event.screenWidth || this.pos.x + 8 < 0) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = 1.0 - this.deathTimer/DEATH_TIME;
            const r1 : number = 8 + 8*t;
            const r2 : number = 15*t;

            // TODO: Maybe alter the color?
            canvas.setColor("#ffffff");
            canvas.fillRing(this.pos.x, this.pos.y, r2, r1);
            return;
        }

        // TODO: Draw the projectile itself
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number, friendly : boolean = true) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
        this.target = this.speed.clone();

        this.id = id;
        this.friendly = friendly;

        this.dying = false;
        this.exist = true;
    }
}
