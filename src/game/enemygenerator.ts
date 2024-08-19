import { ProgramEvent } from "../core/event.js";
import { Enemy } from "./enemy.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { GROUND_LEVEL } from "./background.js";
import { next } from "./existingobject.js";
import { GasParticle } from "./gasparticle.js";
import { Collectible } from "./collectible.js";


export class EnemyGenerator {


    private enemies : Enemy[];

    private timers : number[];

    private readonly projectiles : ObjectGenerator<Projectile>;
    private readonly gasSupply : ObjectGenerator<GasParticle>;
    private readonly collectibles : ObjectGenerator<Collectible>;

    private lastEnemy : number = -1;


    constructor(projectiles : ObjectGenerator<Projectile>,
        gasSupply : ObjectGenerator<GasParticle>,
        collectibles : ObjectGenerator<Collectible>) {

        this.projectiles = projectiles;
        this.gasSupply = gasSupply;
        this.collectibles = collectibles;

        this.enemies = new Array<Enemy> ();
        this.timers = (new Array<number> (3)).fill(0).map((_ : number, i : number) => i*300);
    }


    private spawnEnemy(count : number, event : ProgramEvent) : void {

        const XOFF : number = 32;

        let id : number = (Math.random()*4) | 0;
        if (id == this.lastEnemy) {

            id = (id + 1) % 4;
        }
        this.lastEnemy = id;

        const ground : number = event.screenHeight - GROUND_LEVEL - (id == 3 ? 16 : 0);
        
        const dx : number = event.screenWidth + 16;
        const dy : number = id == 1 ? ground : Math.random()*(ground - 32);

        // Always create four ghosts
        if (id == 3) {

            count = 4;
        }

        const canShoot : boolean = Math.random() < 0.25; // i.e "has mouth"
        for (let i = 0; i < count; ++ i) {

            let e : Enemy | undefined = next<Enemy> (this.enemies);
            if (e === undefined) {

                e = new Enemy(this.projectiles, this.gasSupply, this.collectibles);
                this.enemies.push(e);
            }
            e.spawn(dx + (id != 3 ? i*XOFF : 0), dy, id, i, canShoot);
        }
    }


    private updateTimers(event : ProgramEvent) : void {

        for (let i = 0; i < this.timers.length; ++ i) {

            if ((this.timers[i] -= event.tick) <= 0) {

                const count : number = 1 + ( (Math.random()*3) | 0); 

                this.timers[i] += count*60 + Math.random()*120;
                this.spawnEnemy(count, event);

                // Avoid spawning too many enemies at the same time
                for (let j = 0; j < this.timers.length; ++ j) {

                    if (i == j) continue;

                    this.timers[j] += 30;
                }
            }
        }
    }


    public update(player : Player, event : ProgramEvent) : void {

        this.updateTimers(event);

        for (let i = 0; i < this.enemies.length; ++ i) {

            const e : Enemy = this.enemies[i];

            e.update(event);
            if (e.isActive()) {

                this.projectiles.iterate((p : Projectile) : void => {

                    e.projectileCollision(player, p, event);
                });

                for (let j = i + 1; j < this.enemies.length; ++ j) {

                    e.enemyCollision(this.enemies[j], event);
                }
                e.playerCollision(player, event);
            }
        }
    }


    public preDraw(canvas : Canvas) : void {

        for (let e of this.enemies) {
            
            e.preDraw(canvas);
        }
    }


    public drawShadows(canvas : Canvas) : void {

        for (let e of this.enemies) {
            
            e.drawShadow(canvas);
        }
    }


    public draw(canvas : Canvas) : void {

        for (let e of this.enemies) {

            e.draw(canvas);
        }
    }
}
