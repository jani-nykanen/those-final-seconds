import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Projectile } from "./projectile.js";


const DEATH_TIME : number = 10;


export class Enemy extends GameObject {


    private id : number = 0;

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
        
        const ANIMATION_SPEED : number = 1.0/16.0;

        if (this.pos.x < -24) {

            this.exist = false;
        }
        this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.tick) % 1.0;
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = this.deathTimer/DEATH_TIME;
            const r1 : number = (1 + t)*12;
            const r2 : number = 23*t;

            canvas.setColor("#ffffff");
            canvas.fillRing(this.pos.x, this.pos.y, r2, r1);
            return;
        }

        // Body
        canvas.drawBitmap("e", Flip.None, this.pos.x - 12, this.pos.y - 12, this.id*24, 0, 24, 24);
    }


    public spawn(x : number, y : number, id : number) : void {

        this.pos = new Vector(x, y);
        this.speed.zeros();
        this.target.zeros();

        this.id = id;

        this.dying = false;
        this.exist = true;

        this.animationTimer = 0;
    }


    public projectileCollision(p : Projectile, event : ProgramEvent) : boolean {

        if (!this.exist || this.dying || !p.doesExist() || p.isDying())
            return false;

        if (p.overlay(this)) {

            p.kill(event);
            this.kill(event);
        }
        return false;
    }


    public kill(event : ProgramEvent) : void {

        this.dying = true;
        this.deathTimer = 0.0;
    }
}
