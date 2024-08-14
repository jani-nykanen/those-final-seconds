import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";


export class GasParticle extends GameObject {


    private timer : number = 0;
    private animationSpeed : number = 0;
    private id : number = 0;
    

    constructor() {

        super(0, 0, false);
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        if ((this.timer += this.animationSpeed*event.tick) >= 1.0) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist) {

            return;
        }

        const sx : number = Math.floor(this.timer*4)*16;
        canvas.drawBitmap(bmp, Flip.None, this.pos.x - 8, this.pos.y - 8, sx, this.id*16, 16, 16);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, animationSpeed : number, id : number) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
        this.target = this.speed.clone();
        this.animationSpeed = animationSpeed;
        this.timer = 0.0;

        this.id = id;

        this.dying = false;
        this.exist = true;
    }
}
