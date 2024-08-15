import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Projectile } from "./projectile.js";
import { ProjectileGenerator } from "./projectilegenerator.js";


const DEATH_TIME : number = 10;


export class Enemy extends GameObject {


    private id : number = 0;

    private animationTimer : number = 0;
    private deathTimer : number = 0.0;

    private projectiles : ProjectileGenerator | undefined = undefined;
    

    constructor() {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 24, 24);

        this.shadowWidth = 12;
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
            return;
        }
        this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.tick) % 1.0;

        this.target.x = -1.5;
        this.speed.x = this.target.x;
    }


    public draw(canvas : Canvas, bmpBody : Bitmap, bmpGameArt : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = this.deathTimer/DEATH_TIME;
            const r1 : number = (1 + t)*12;
            const r2 : number = 23*t;

            // TODO: Different colors for different enemies
            canvas.setColor("#ffdb00");
            canvas.fillRing(this.pos.x, this.pos.y, r2, r1);
            return;
        }

        // Body
        canvas.drawBitmap(bmpBody, Flip.None, this.pos.x - 12, this.pos.y - 12, this.id*24, 0, 24, 24);
    }


    public spawn(x : number, y : number, id : number, projectiles : ProjectileGenerator) : void {

        this.pos = new Vector(x, y);
        this.speed.zeros();
        this.target.zeros();

        this.id = id;

        this.dying = false;
        this.exist = true;

        this.animationTimer = 0;

        this.projectiles = projectiles;
    }


    public projectileCollision(p : Projectile, event : ProgramEvent) : boolean {

        if (!this.exist || this.dying || !p.doesExist() || p.isDying())
            return false;

        const ppos : Vector = p.getPosition();

        if (Math.hypot(ppos.x - this.pos.x, ppos.y - this.pos.y) < 12 + p.radius) {

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
