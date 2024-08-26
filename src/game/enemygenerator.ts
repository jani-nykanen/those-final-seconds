import { ProgramEvent } from "../core/event.js";
import { Enemy } from "./enemy.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Canvas } from "../gfx/canvas.js";
import { GROUND_LEVEL } from "./game.js";
import { next } from "./existingobject.js";
import { GasParticle } from "./gasparticle.js";
import { Collectible } from "./collectible.js";
import { sampleDiscreteDistributionInterpolate } from "./sampling.js";


const INITIAL_TIMER_TIMES : number[] = [0, 60, 300, 1800];
const TERMINAL_TIME : number = 60*120; // Two minutes

const ENEMY_WEIGHTS : number[][] = [[0.50, 0.40, 0.05, 0.0], [0.25, 0.25, 0.25, 0.25]];


export class EnemyGenerator {


    private enemies : Enemy[];

    private timers : number[];

    private readonly projectiles : ObjectGenerator<Projectile>;
    private readonly gasSupply : ObjectGenerator<GasParticle>;
    private readonly collectibles : ObjectGenerator<Collectible>;

    private lastEnemy : number = -1;

    private stageTimer : number = 0.0;
    private relativeTime : number = 0.0;


    constructor(projectiles : ObjectGenerator<Projectile>,
        gasSupply : ObjectGenerator<GasParticle>,
        collectibles : ObjectGenerator<Collectible>) {

        this.projectiles = projectiles;
        this.gasSupply = gasSupply;
        this.collectibles = collectibles;

        this.enemies = new Array<Enemy> ();
        this.timers = Array.from(INITIAL_TIMER_TIMES);
    }


    private spawnEnemy(count : number, event : ProgramEvent) : void {

        const MOUTH_PROB_INITIAL : number = 0.0;
        const MOUTH_PROB_TERMINAL : number = 0.5;

        const XOFF : number = 32;

        let id : number = sampleDiscreteDistributionInterpolate(ENEMY_WEIGHTS[0], ENEMY_WEIGHTS[1], this.relativeTime);
        if (id == this.lastEnemy) {

            id = (id + 1) % 4;
        }
        this.lastEnemy = id;

        const ground : number = event.screenHeight - GROUND_LEVEL - (id == 3 ? 48 : 24);
        
        const dx : number = event.screenWidth + 16;
        const dy : number = id == 1 ? ground : Math.random()*ground;

        // Always create four ghosts
        if (id == 3) {

            count = 4;
        }

        const canShoot : boolean = Math.random() < (MOUTH_PROB_INITIAL*(1.0 - this.relativeTime) + MOUTH_PROB_TERMINAL*this.relativeTime);
        for (let i = 0; i < count; ++ i) {

            let e : Enemy | undefined = next<Enemy> (this.enemies);
            if (e === undefined) {

                e = new Enemy(this.projectiles, this.gasSupply, this.collectibles);
                this.enemies.push(e);
            }
            e.spawn(dx + (id != 3 ? i*XOFF : 0), dy, id, i, canShoot);
        }
    }


    private updateTimers(globalSpeed : number, event : ProgramEvent) : void {

        this.stageTimer = Math.min(TERMINAL_TIME, this.stageTimer + event.tick);
        this.relativeTime = this.stageTimer/TERMINAL_TIME;

        const enemyMaxCount : number = Math.floor(3 + this.relativeTime*2)

        for (let i = 0; i < this.timers.length; ++ i) {

            if ((this.timers[i] -= globalSpeed*event.tick) <= 0) {

                const count : number = 1 + ((Math.random()*enemyMaxCount) | 0); 

                this.timers[i] += count*30 + Math.random()*60;
                this.spawnEnemy(count, event);

                // Avoid spawning too many enemies at the same time
                for (let j = 0; j < this.timers.length; ++ j) {

                    if (i == j) continue;
                    this.timers[j] += 15;
                }
            }
        }
    }


    public update(globalSpeed : number, player : Player, event : ProgramEvent) : void {

        this.updateTimers(globalSpeed, event);

        for (let i = 0; i < this.enemies.length; ++ i) {

            const e : Enemy = this.enemies[i];

            e.update(globalSpeed, event);
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
