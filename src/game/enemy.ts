import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Projectile } from "./projectile.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Player } from "./player.js";
import { clamp } from "../math/utility.js";
import { GasParticle } from "./gasparticle.js";
import { Collectible } from "./collectible.js";


const DEATH_TIME : number = 16;
const BASE_SPEED : number = 1.5;
const JUMP_TIME : number = 30;

const ORBIT_DISTANCE : number = 32;

const SHOOT_WAIT_MIN : number = 30;
const SHOOT_WAIT_VARY : number = 90;
const MOUTH_TIME : number = 20;


const PROPELLER_ANGLE : number[] = [0, 0, -Math.PI/2, Math.PI, 0];

const ANIMATION_SPEED : number[] = [Math.PI*2/120.0, undefined, Math.PI*2/60.0, Math.PI*2/240.0, undefined];


export class Enemy extends GameObject {


    private startY : number = 0.0;
    private centerX : number = 0.0;

    private id : number = 0;

    private animationTimer : number = 0;
    private animationFlag : number = 0;

    private gasTimer : number = 0.0;
    private propellerTimer : number = 0;
    private deathTimer : number = 0.0;

    private canBeMoved : boolean = true;
    private canShoot : boolean = false;

    private shootWaitTimer : number = 0.0;
    private mouthTimer : number = 0.0;

    private readonly projectiles : ObjectGenerator<Projectile>;
    private readonly gasSupply : ObjectGenerator<GasParticle>;
    private readonly collectibles : ObjectGenerator<Collectible>;
    

    constructor(projectiles : ObjectGenerator<Projectile>,
        gasSupply : ObjectGenerator<GasParticle>,
        collectibles : ObjectGenerator<Collectible>) {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 18, 18);

        this.shadowWidth = 6;

        this.friction = new Vector(0.15, 0.15);

        this.projectiles = projectiles;
        this.gasSupply = gasSupply;
        this.collectibles = collectibles;
    }


    private shoot(count : number, shootAngle : number, speed : number, event : ProgramEvent) : void {

        if (!this.canShoot) {

            return;
        }

        const startAngle : number = -(count - 1)*shootAngle/2;
        for (let i = 0; i < count; ++ i) {

            const angle : number = startAngle + i*shootAngle;

            const speedx : number = -Math.cos(angle)*speed;
            const speedy : number = Math.sin(angle)*speed;

            this.projectiles.next().spawn(this.pos.x - 10, this.pos.y, 
                this.speed.x + speedx, speedy, 1);
        }
        this.mouthTimer = MOUTH_TIME;
    }


    private drawPropeller(canvas : Canvas) : void {

        const frame : number = (this.propellerTimer*4) | 0; 

        const angle : number = PROPELLER_ANGLE[this.id];
        const dx : number = this.pos.x + Math.cos(angle + Math.PI/2)*17;
        const dy : number = this.pos.y - Math.sin(angle + Math.PI/2)*17;

        canvas.drawBitmap("ro", Flip.None, dx - 8, dy - 8, frame*16, 0, 16, 16, 8, 8, angle);
    }


    protected die(event: ProgramEvent) : boolean {
        
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        if (this.id == 1 && this.animationFlag > 0) {

            this.animationFlag = 0;
            this.animationTimer = JUMP_TIME;
        }
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const PROPELLER_SPEED : number = 1.0/16.0;
        const GAS_TIME : number = 6.0;
        const GRAVITY : number = 4.0;
        const JUMP_SPEED : number = -4.0;

        if (this.pos.x < -24) {

            this.exist = false;
            return;
        }
        
        if (this.pos.x >= event.screenWidth + 16 && this.id != 3) {

            return;
        }

        if (this.mouthTimer > 0) {

            this.mouthTimer -= event.tick;
        }

        this.propellerTimer = (this.propellerTimer + PROPELLER_SPEED*event.tick) % 1.0;
        const animationSpeed : number | undefined = ANIMATION_SPEED[this.id];
        if (animationSpeed !== undefined) {

            this.animationTimer = (this.animationTimer + animationSpeed*event.tick) % (Math.PI*2);
        }

        switch (this.id) {

        // Flying default ball
        case 0:

            this.pos.y = this.startY + Math.sin(this.animationTimer)*8.0;
            if (this.mouthTimer <= 0 && (this.shootWaitTimer -= event.tick) <= 0) {

                this.shootWaitTimer = SHOOT_WAIT_MIN + Math.random()*SHOOT_WAIT_VARY;
                this.shoot(1, 0.0, 3.0, event);
            }
            break;

        // Jumping ball
        case 1:

            this.target.y = GRAVITY;
            if (this.animationFlag == 0) {

                this.target.x = -BASE_SPEED;
                if ((this.animationTimer -= event.tick) <= 0) {

                    this.animationTimer = 8 + 8*Math.random();

                    this.speed.x = -BASE_SPEED*1.25;
                    this.target.x = this.speed.x;
                    this.speed.y = JUMP_SPEED;

                    ++ this.animationFlag;
                }
                break;
            }

            if ((this.animationTimer -= event.tick) > 0) {

                this.speed.y = JUMP_SPEED;
                break;
            }
            
            if (this.canShoot && this.speed.y > 0.0 &&
                this.animationFlag != 2) {

                this.shoot(3, Math.PI/8, 2.5, event);
                this.animationFlag = 2;

                this.speed.x = 2.0;
            }
            break;

        // Missile
        case 2:

            if (this.animationFlag == 0) {

                this.animationTimer = 0.0;
                this.speed.x = -BASE_SPEED/4;
                if (this.pos.x < event.screenWidth) {

                    this.speed.zeros();
                    ++ this.animationFlag;
                    for (let i = 0; i < 3; ++ i) {
                        
                        this.shoot(1, 0.0, 3.5 + i*0.5, event);
                    }
                }
                break;
            }
            this.target.x = -BASE_SPEED*2.0; 
            this.pos.y = this.startY + Math.sin(this.animationTimer)*4.0;
            if ((this.gasTimer += event.tick) >= GAS_TIME) {

                this.gasTimer -= GAS_TIME;
                this.gasSupply.next().spawn(this.pos.x + 12, this.pos.y, 0.0, 0.0, 0);
            }

            break;
            
        // Ghost
        case 3: {

            const oldY : number = this.pos.y;

            this.centerX -= BASE_SPEED*event.tick;
            this.pos.x = this.centerX + Math.cos(-this.animationTimer)*ORBIT_DISTANCE;
            this.pos.y = this.startY + Math.sin(-this.animationTimer)*ORBIT_DISTANCE;

            if (oldY < this.startY - 12 && this.pos.y >= this.startY - 12) {

                this.shoot(1, 0.0, 3.0, event);
            }
        }
        break;

        default:
            break;
        }
    }


    public preDraw(canvas : Canvas) : void {

        const RING_COUNT : number = 5;

        if (!this.isActive() || this.id != 3) {

            return;
        }

        const dir : Vector = this.pos.directionTo(new Vector(this.centerX, this.startY));
        for (let i = 0; i <= RING_COUNT; ++ i) {

            const distance : number = i*ORBIT_DISTANCE/RING_COUNT;
            canvas.drawBitmap("g", Flip.None, 
                this.pos.x - 4 + dir.x*distance, 
                this.pos.y - 4 + dir.y*distance, 
                24, 64, 8, 8);
        }
    }


    public draw(canvas : Canvas) : void {
        
        const MUZZLE_FLASH_TIME : number = 12;

        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = ((this.deathTimer/DEATH_TIME)*4) | 0;
            canvas.drawBitmap("r2", Flip.None, this.pos.x - 24, this.pos.y - 24, t*48, 0, 48, 48);
            return;
        }

        // Propeller
        if (this.id != 1) {
            
            this.drawPropeller(canvas);
        }

        // Body
        canvas.drawBitmap("e", Flip.None, this.pos.x - 12, this.pos.y - 12, this.id*24, 0, 24, 24);
        // Mouth (if shooting)
        if (this.canShoot) {

            canvas.drawBitmap("g", Flip.None, this.pos.x - 11, this.pos.y - 4, 
                48 - 16*Number(this.mouthTimer > 0), 64, 16, 8);

            // Muzzle flash
            if (this.mouthTimer > MOUTH_TIME - MUZZLE_FLASH_TIME) {

                const t : number = 1.0 - (this.mouthTimer - MOUTH_TIME + MUZZLE_FLASH_TIME )/MUZZLE_FLASH_TIME;
                canvas.drawBitmap("r1", Flip.None, this.pos.x - 24, this.pos.y - 12, ((t*4) | 0)*24, 24, 24, 24);
            }
            return;
        }
        // Face otherwise
        let faceY : number = 0;
        if (this.id == 1) {

            faceY = clamp(Math.round(this.speed.y), -3, 3);
        }
        canvas.drawBitmap("e", Flip.None, this.pos.x - 12, this.pos.y - 12 + faceY, this.id*24, 24, 24, 24);
    }


    public spawn(x : number, y : number, id : number, shift : number, canShoot : boolean = false) : void {

        this.pos = new Vector(x, y);
        this.speed.y = 0.0;
        this.target.y = 0.0;
        this.startY = y;

        this.target.x = -BASE_SPEED;
        this.speed.x = this.target.x;
        this.friction.x = id == 2 ? 0.05 : 0.15;

        this.id = id;

        this.dying = false;
        this.exist = true;
        this.canBeMoved = id != 3;
        this.canShoot = canShoot;

        this.shootWaitTimer = SHOOT_WAIT_MIN + Math.random()*SHOOT_WAIT_VARY;
        this.mouthTimer = 0.0;

        this.gasTimer = 0.0;
        this.animationTimer = 0.0;

        // Enemy-specific "settings"
        switch (this.id) {

        case 1:
            this.animationTimer = JUMP_TIME; // 120*shift;
            break;

        case 2: 

            this.pos.x += shift*16;
            this.pos.y += shift*(y < 96 ? 1 : -1)*24;
            this.startY = this.pos.y;
            break;

        case 3: 

            this.animationTimer = Math.PI/2*shift;
            this.centerX = x + ORBIT_DISTANCE;
            // this.pos.x = this.centerX + Math.cos(this.animationTimer)*ORBIT_DISTANCE;
            //this.pos.y = y + Math.sin(this.animationTimer)*ORBIT_DISTANCE;
            this.speed.zeros();
            this.target.zeros();

            break;
        
        default:
            break;
        }

        this.animationFlag = 0;
    }


    public projectileCollision(player : Player, p : Projectile, event : ProgramEvent) : void {

        if (!this.isActive() || !p.isActive() || !this.isInsideScreen(event) || !p.isFriendly())
            return;

        if (this.overlay(p)) {

            p.kill(event);
            this.kill(event);
            
            player.addExperience(1.0);

        }
    }


    public enemyCollision(e : Enemy, event : ProgramEvent) : void {

        const RADIUS : number = 10;

        if (!this.isActive() || !e.isActive() || !this.isInsideScreen(event) || !e.isInsideScreen(event))
            return;

        let dist : number = RADIUS*2 - this.pos.distanceFrom(e.pos);
        if (dist > 0) {

            const dir : Vector = this.pos.directionTo(e.pos);

            // If only one of the objects can be moved, then apply double the
            // distance to escape the collision area.
            if (!this.canBeMoved || !e.canBeMoved) {

                dist *= 2;
            }

            if (this.canBeMoved) {

                this.pos.x -= dir.x*dist/2;
                this.pos.y -= dir.y*dist/2;
                this.startY -= dir.y*dist/2;
            }

            if (e.canBeMoved) {

                e.pos.x += dir.x*dist/2;
                e.pos.y += dir.y*dist/2;
                e.startY += dir.y*dist/2;
            }
        }
    }


    public playerCollision(p : Player, event : ProgramEvent) : void {

        if (!this.isActive() || !p.isActive()) {

            return;
        }

        if (this.overlay(p)) {

            p.hurt(event);
        }
    }


    public kill(event : ProgramEvent) : void {

        this.dying = true;
        this.deathTimer = 0.0;

        this.collectibles.next().spawn(this.pos.x, this.pos.y, 2.0, -1.0, 0);
    }


    public isInsideScreen = (event : ProgramEvent) : boolean => this.pos.x < event.screenWidth + 12;
}
