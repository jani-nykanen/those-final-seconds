import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { Player } from "./player.js";


const DEATH_TIME : number = 10;


export class Projectile extends GameObject {


    private id : number = 0;
    private deathTimer : number = 0.0;


    constructor() {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 6, 6);
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.kill(event);
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        if (this.pos.x - 8 > event.screenWidth || this.pos.x + 8 < 0 ||
            this.pos.y + 8 < CAMERA_MIN_Y) {

            this.exist = false;
            // console.log("Poof!");
        }
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

        canvas.drawBitmap(bmp, Flip.None, this.pos.x - 8, this.pos.y - 8, this.id*16, 0, 16, 16);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
        this.target = this.speed.clone();

        this.id = id;

        this.dying = false;
        this.exist = true;
    }


    public kill(event : ProgramEvent) : void {

        this.dying = true;
        this.deathTimer = 0.0;
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!this.isActive() || !player.isActive() || this.id == 0 || !this.overlay(player))
            return;

        player.hurt(event);
        this.kill(event);
    }


    public isFriendly = () : boolean => this.id == 0;
}
