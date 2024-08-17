import { ProgramEvent } from "../core/event.js";
import { next } from "./existingobject.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { GameObject } from "./gameobject.js";


export class ObjectGenerator<T extends GameObject> {


    private objects : T[];
    private type : Function;


    constructor(type : Function) {

        this.objects = new Array<T> ();
        this.type = type;
    }


    public next() : T {

        let p : T | undefined = next<T> (this.objects);
        if (p === undefined) {

            p = new this.type.prototype.constructor();
            this.objects.push(p);
        }
        return p;
    }


    public update(event : ProgramEvent) : void {

        for (let o of this.objects) {

            o.update(event);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {

        for (let o of this.objects) {

            o.draw(canvas, bmp);
        }
    }


    public iterate(func : (p : T) => void) : void {

        for (let p of this.objects) {

            if (!p.isActive())
                continue;
            func(p);
        }
    }
}
