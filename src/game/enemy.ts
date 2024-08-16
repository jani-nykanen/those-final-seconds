import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Projectile } from "./projectile.js";
import { ProjectileGenerator } from "./projectilegenerator.js";
import { Player } from "./player.js";


const DEATH_TIME : number = 10;
const BASE_SPEED : number = 1.5;


export class Enemy extends GameObject {


    private startY : number = 0.0;

    private id : number = 0;

    private animationTimer : number = 0;
    private deathTimer : number = 0.0;
    private hurtTimer : number = 0.0;

    private health : number = 0;

    private projectiles : ProjectileGenerator | undefined = undefined;
    

    constructor() {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 22, 22);

        this.shadowWidth = 24;
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.dying = true;
        this.deathTimer = 0.0;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const WAVE_SPEED : number = Math.PI*2/120.0;
        const AMPLITUDE : number = 8.0;

        if (this.pos.x < -24) {

            this.exist = false;
            return;
        }

        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }
        
        switch (this.id) {

        case 0:
            this.animationTimer = (this.animationTimer + WAVE_SPEED*event.tick) % (Math.PI*2);
            this.pos.y = this.startY + Math.sin(this.animationTimer)*AMPLITUDE;
            break;

        default:
            break;
        }
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

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 != 0) {

            return;
        }

        // Body
        canvas.drawBitmap(bmpBody, Flip.None, this.pos.x - 12, this.pos.y - 12, this.id*24, 0, 24, 24);
    }


    public spawn(x : number, y : number, id : number, shift : number, projectiles : ProjectileGenerator) : void {

        this.pos = new Vector(x, y);
        this.speed.y = 0.0;
        this.target.y = 0.0;

        this.target.x = -BASE_SPEED;
        this.speed.x = this.target.x;

        this.startY = y;

        this.id = id;

        this.dying = false;
        this.exist = true;

        this.animationTimer = Math.PI/3*shift;

        this.projectiles = projectiles;

        this.health = 3;
    }


    public projectileCollision(player : Player, p : Projectile, event : ProgramEvent) : boolean {

        const HURT_TIME : number = 30;
        const KNOCKBACK : number = 2.0;

        if (!this.isActive() || !p.isActive())
            return false;

        if (this.overlay(p)) {

            p.kill(event);

            if ((-- this.health) <= 0) {

                this.kill(event);
                player.addExperience(1.0);
            }
            else {

                this.hurtTimer = HURT_TIME;
                // TODO: Also apply global speed?
                this.speed.x = KNOCKBACK;
            }
        }
        return false;
    }


    public enemyCollision(e : Enemy) : void {

        if (!this.isActive() || !e.isActive())
            return;

        const dist : number = 24 - this.pos.distanceFrom(e.pos);
        if (dist > 0) {

            const dir : Vector = this.pos.directionTo(e.pos);

            this.pos.x -= dir.x*dist/2;
            this.pos.y -= dir.y*dist/2;
            this.startY -= dir.y*dist/2;

            e.pos.x += dir.x*dist/2;
            e.pos.y += dir.y*dist/2;
            e.startY += dir.y*dist/2;
        }
    }


    public kill(event : ProgramEvent) : void {

        this.dying = true;
        this.deathTimer = 0.0;
    }
}
