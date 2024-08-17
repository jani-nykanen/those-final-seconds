import { GameObject } from "./gameobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { Projectile } from "./projectile.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Player } from "./player.js";
import { clamp } from "../math/utility.js";
import { GasParticle } from "./gasparticle.js";


const DEATH_TIME : number = 12;
const BASE_SPEED : number = 1.5;
const JUMP_TIME : number = 30;


const DEATH_COLORS : string[][] = [
    ["#ff6d00", "#ffdb00"],
    ["#2492db", "#6ddbff"],
    ["#6d6d6d", "#b6b6b6"],
];

const PROPELLER_ANGLE : number[] = [0, 0, -Math.PI/2, 0, 0];


export class Enemy extends GameObject {


    private startY : number = 0.0;

    private id : number = 0;

    private animationTimer : number = 0;
    private animationFlag : number = 0;

    private gasTimer : number = 0.0;
    private propellerTimer : number = 0;
    private deathTimer : number = 0.0;
    private hurtTimer : number = 0.0;

    private health : number = 0;

    private touchSurface : boolean = false;

    private readonly projectiles : ObjectGenerator<Projectile>;
    private readonly gasSupply : ObjectGenerator<GasParticle>;
    

    constructor(projectiles : ObjectGenerator<Projectile>,
        gasSupply : ObjectGenerator<GasParticle>) {

        super(0, 0, false);

        this.hitbox = new Rectangle(0, 0, 18, 18);

        this.shadowWidth = 20;

        this.friction = new Vector(0.15, 0.15);

        this.projectiles = projectiles;
        this.gasSupply = gasSupply;
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
        
        this.touchSurface = true;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const WAVE_SPEED : number = Math.PI*2/120.0;
        const PROPELLER_SPEED : number = 1.0/16.0;
        const GAS_TIME : number = 6.0;
        const GRAVITY : number = 4.0;

        if (this.pos.x < -24) {

            this.exist = false;
            return;
        }
        
        if (this.pos.x >= event.screenWidth + 16) {

            return;
        }

        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }

        this.propellerTimer = (this.propellerTimer + PROPELLER_SPEED*event.tick) % 1.0;
        
        switch (this.id) {

        case 0:

            this.target.x = -BASE_SPEED;

            this.animationTimer = (this.animationTimer + WAVE_SPEED*event.tick) % (Math.PI*2);
            this.pos.y = this.startY + Math.sin(this.animationTimer)*8.0;
            break;

        case 1:

            this.target.y = GRAVITY;
            if (this.touchSurface) {

                this.animationTimer -= event.tick;
                this.target.x = -BASE_SPEED;
            }

            if (this.animationTimer <= 0) {

                this.speed.y = -(4.5 + Math.random()*1.5); 
                this.animationTimer += JUMP_TIME;

                this.speed.x = -BASE_SPEED*1.25;
                this.target.x = this.speed.x;
            }
            break;

        case 2:

            if (this.animationFlag == 0) {

                this.speed.x = -BASE_SPEED/4;
                if (this.pos.x < event.screenWidth) {

                    this.speed.zeros();
                    ++ this.animationFlag;
                }
                break;
            }
            this.target.x = -BASE_SPEED*2.0; 

            this.animationTimer = (this.animationTimer + WAVE_SPEED*2*event.tick) % (Math.PI*2);
            this.pos.y = this.startY + Math.sin(this.animationTimer)*4.0;

            if ((this.gasTimer += event.tick) >= GAS_TIME) {

                this.gasTimer -= GAS_TIME;
                this.gasSupply.next().spawn(this.pos.x + 12, this.pos.y, 0.0, 0.0, 0);
            }

            break;

        default:
            break;
        }

        this.touchSurface = false;
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist) {

            return;
        }

        if (this.dying) {

            const t : number = this.deathTimer/DEATH_TIME;
            
            canvas.setColor(DEATH_COLORS[this.id][0]);
            canvas.fillRing(this.pos.x, this.pos.y, 19*t, (1 + t)*10);

            canvas.setColor(DEATH_COLORS[this.id][1]);
            canvas.fillRing(this.pos.x - 1, this.pos.y - 1, 18*t, (1 + t)*9);

            return;
        }

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 != 0) {

            return;
        }

        // Propeller
        if (this.id != 1) {
            
            this.drawPropeller(canvas);
        }

        // Body
        canvas.drawBitmap("e", Flip.None, this.pos.x - 12, this.pos.y - 12, this.id*24, 0, 24, 24);
        // Face
        let faceY : number = 0;
        if (this.id == 1) {

            faceY = clamp(Math.round(this.speed.y), -3, 3);
        }
        canvas.drawBitmap("e", Flip.None, this.pos.x - 12, this.pos.y - 12 + faceY, this.id*24, 24, 24, 24);
    }


    public spawn(x : number, y : number, id : number, shift : number) : void {

        this.pos = new Vector(x, y);
        this.speed.y = 0.0;
        this.target.y = 0.0;

        this.target.x = -BASE_SPEED;
        this.speed.x = this.target.x;
        this.friction.x = id == 2 ? 0.05 : 0.15;

        this.id = id;

        this.dying = false;
        this.exist = true;

        this.hurtTimer = 0.0;
        this.health = 2; // 3;

        this.gasTimer = 0.0;
        this.animationTimer = 0.0;

        // Enemy-specific "settings"
        switch (this.id) {

        case 1:
            this.animationTimer = JUMP_TIME; // 120*shift;
            break;

        case 2: {

            this.pos.x += shift*16;
            this.pos.y += shift*(y < 96 ? 1 : -1)*24;
            break;
        }

        default:
            break;
        }
        this.animationFlag = 0;

        this.startY = this.pos.y;
    }


    public projectileCollision(player : Player, p : Projectile, event : ProgramEvent) : boolean {

        const HURT_TIME : number = 30;
        const KNOCKBACK : number = 2.0;

        if (!this.isActive() || !p.isActive() || !this.isInsideScreen(event))
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


    public enemyCollision(e : Enemy, event : ProgramEvent) : void {

        const RADIUS : number = 10;

        if (!this.isActive() || !e.isActive() || !this.isInsideScreen(event) || !e.isInsideScreen(event))
            return;

        const dist : number = RADIUS*2 - this.pos.distanceFrom(e.pos);
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
    }


    public isInsideScreen = (event : ProgramEvent) : boolean => this.pos.x < event.screenWidth + 12;
}
