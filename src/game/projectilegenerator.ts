import { ProgramEvent } from "../core/event.js";
import { next } from "./existingobject.js";
import { Projectile } from "./projectile.js";
import { Player } from "./player.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";


export class ProjectileGenerator {


    private projectiles : Projectile[];


    constructor() {

        this.projectiles = new Array<Projectile> ();
    }


    public next() : Projectile {

        let p : Projectile | undefined = next<Projectile> (this.projectiles);
        if (p === undefined) {

            p = new Projectile();
            this.projectiles.push(p);
        }
        return p;
    }


    public update(player : Player, event : ProgramEvent) : void {

        for (let o of this.projectiles) {

            o.update(event);
            // TODO: Player & enemy collisions
        }
    }


    public draw(canvas : Canvas) : void {

        const bmp : Bitmap = canvas.getBitmap("pr");

        for (let o of this.projectiles) {

            o.draw(canvas, bmp);
        }
    }


    public iterate(func : (p : Projectile) => void) : void {

        for (let p of this.projectiles) {

            if (!p.isActive())
                return;

            func(p);
        }
    }
}
