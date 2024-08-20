import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Player } from "./player.js";


const DEATH_TIME : number = 10;
const GRAVITY : number = 3.0;
const BASE_SPEED : number = 1.5;


export class Collectible extends GameObject {


    private id : number = 0;
    private deathTimer : number = 0.0;
    private animationTimer : number = 0.0;

    private startY : number = 0.0;


    constructor() {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 16, 16);

        this.friction.x = 0.05;
        this.friction.y = 0.075;

        this.bounceFactor = 1.25;

        this.shadowWidth = 4;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        const MIN_SPEED : number = -2.5;

        this.speed.y = Math.min(MIN_SPEED, this.speed.y);
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const ANIMATION_SPEED : number = 1.0/64.0;

        if (this.pos.x + 8 < 0) {

            this.exist = false;
        }
        this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.tick) % 1.0;

        if (this.id == 1) {

            this.pos.y = this.startY + Math.sin(this.animationTimer*Math.PI*2)*4;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = this.deathTimer/DEATH_TIME;
            canvas.drawBitmap("r1", Flip.None, this.pos.x - 12, this.pos.y - 12, ((t*4) | 0)*24, 96 + this.id*24, 24, 24);
            return;
        }
        
        if (this.id == 1) {

            canvas.drawBitmap("g", Flip.None, this.pos.x - 8, this.pos.y - 8, 48, 48, 16, 16);
            canvas.drawBitmap("fo", Flip.None, this.pos.x - 5, this.pos.y - 7, 11*16, 0, 16, 16);
            return;
        }
        canvas.drawBitmap(bmp, Flip.None, this.pos.x - 8, this.pos.y - 8, ((this.animationTimer*8) | 0)*16, 0, 16, 16);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx*(1 - id), speedy*(1 - id),);
        this.target.x = -BASE_SPEED;
        this.target.y = GRAVITY*(1 - id);

        this.startY = y;

        this.id = id;

        this.dying = false;
        this.exist = true;
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!this.isActive() || !player.isActive())
            return;

        if (this.overlay(player)) {

            if (this.id == 0) {

                player.stats.addTimeFreeze(2.0);
            }
            else {

                player.stats.addHealth(1);
            }

            this.dying = true;
            this.deathTimer = 0.0;
        }
    }
}
