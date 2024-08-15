import { ProgramEvent } from "../core/event.js";
import { Enemy } from "./enemy.js";
import { ProjectileGenerator } from "./projectilegenerator.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { GROUND_LEVEL } from "./background.js";
import { next } from "./existingobject.js";


export class EnemyGenerator {


    private enemies : Enemy[];

    private timers : number[];


    constructor() {

        this.enemies = new Array<Enemy> ();
        this.timers = (new Array<number> (3)).fill(0).map((_ : number, i : number) => i*300);
    }


    private spawnEnemy(projectiles : ProjectileGenerator, event : ProgramEvent) : void {

        const dx : number = event.screenWidth + 16;
        const dy : number = Math.random()*(event.screenHeight - GROUND_LEVEL - 32);

        let e : Enemy | undefined = next<Enemy> (this.enemies);
        if (e === undefined) {

            e = new Enemy();
            this.enemies.push(e);
        }
        e.spawn(dx, dy, 0, projectiles);
    }


    private updateTimers(projectiles : ProjectileGenerator, event : ProgramEvent) : void {

        for (let i = 0; i < this.timers.length; ++ i) {

            if ((this.timers[i] -= event.tick) <= 0) {

                this.timers[i] += 60 + Math.random()*120;
                this.spawnEnemy(projectiles, event);
            }
        }
    }


    public update(player : Player, projectiles : ProjectileGenerator, event : ProgramEvent) : void {

        this.updateTimers(projectiles, event);

        for (let e of this.enemies) {

            e.update(event);
            if (e.isActive()) {

                projectiles.iterate((p : Projectile) : void => {

                    e.projectileCollision(p, event);
                });

                // TODO: Player collision
            }
        }
    }


    public preDraw(canvas : Canvas) : void {

        for (let e of this.enemies) {

            e.drawShadow(canvas);
        }
    }


    public draw(canvas : Canvas) : void {

        const bmpGameArt : Bitmap = canvas.getBitmap("g");
        const bmpEnemyBody : Bitmap = canvas.getBitmap("e");

        for (let e of this.enemies) {

            e.draw(canvas, bmpEnemyBody, bmpGameArt);
        }
    }
}
