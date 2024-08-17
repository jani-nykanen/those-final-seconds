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

const ORBIT_DISTANCE_MIN : number = 24;
const ORBIT_VARY : number = 32;


const DEATH_COLORS : string[][] = [
    ["#ff6d00", "#ffdb00"],
    ["#2492db", "#6ddbff"],
    ["#6d6d6d", "#b6b6b6"],
    ["#b649db", "#db92ff"],
];

const PROPELLER_ANGLE : number[] = [0, 0, -Math.PI/2, Math.PI, 0];


export class Enemy extends GameObject {


    private startY : number = 0.0;
    private centerX : number = 0.0;

    private id : number = 0;

    private animationTimer1 : number = 0;
    private animationTimer2 : number = 0;
    private animationFlag : number = 0;

    private gasTimer : number = 0.0;
    private propellerTimer : number = 0;
    private deathTimer : number = 0.0;

    private touchSurface : boolean = false;

    private canBeMoved : boolean = true;

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
        
        if (this.pos.x >= event.screenWidth + 16 && this.id != 3) {

            return;
        }

        this.propellerTimer = (this.propellerTimer + PROPELLER_SPEED*event.tick) % 1.0;
        
        switch (this.id) {

        // Flying default ball
        case 0:

            this.target.x = -BASE_SPEED;

            this.animationTimer1 = (this.animationTimer1 + WAVE_SPEED*event.tick) % (Math.PI*2);
            this.pos.y = this.startY + Math.sin(this.animationTimer1)*8.0;
            break;

        // Jumping ball
        case 1:

            this.target.y = GRAVITY;
            if (this.touchSurface) {

                this.animationTimer1 -= event.tick;
                this.target.x = -BASE_SPEED;
            }

            if (this.animationTimer1 <= 0) {

                this.speed.y = -(4.5 + Math.random()*1.5); 
                this.animationTimer1 += JUMP_TIME;

                this.speed.x = -BASE_SPEED*1.25;
                this.target.x = this.speed.x;
            }
            break;

        // Missile
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

            this.animationTimer1 = (this.animationTimer1 + WAVE_SPEED*2*event.tick) % (Math.PI*2);
            this.pos.y = this.startY + Math.sin(this.animationTimer1)*4.0;

            if ((this.gasTimer += event.tick) >= GAS_TIME) {

                this.gasTimer -= GAS_TIME;
                this.gasSupply.next().spawn(this.pos.x + 12, this.pos.y, 0.0, 0.0, 0);
            }

            break;
            
        // Ghost
        case 3: {

                this.centerX -= BASE_SPEED*event.tick;

                this.animationTimer1 = (this.animationTimer1 + Math.PI*2/180*event.tick) % (Math.PI*2);
                this.animationTimer2 = (this.animationTimer2 + Math.PI*2/240*event.tick) % (Math.PI*2);
                
                const radius : number = ORBIT_DISTANCE_MIN + (1.0 + Math.sin(this.animationTimer2))*ORBIT_VARY/2.0;

                this.pos.x = this.centerX + Math.cos(this.animationTimer1)*radius;
                this.pos.y = this.startY + Math.sin(this.animationTimer1)*radius;
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
        this.startY = y;

        this.target.x = -BASE_SPEED;
        this.speed.x = this.target.x;
        this.friction.x = id == 2 ? 0.05 : 0.15;

        this.id = id;

        this.dying = false;
        this.exist = true;
        this.canBeMoved = id != 3;

        this.gasTimer = 0.0;
        this.animationTimer1 = 0.0;
        this.animationTimer2 = 0.0;

        // Enemy-specific "settings"
        switch (this.id) {

        case 1:
            this.animationTimer1 = JUMP_TIME; // 120*shift;
            break;

        case 2: 

            this.pos.x += shift*16;
            this.pos.y += shift*(y < 96 ? 1 : -1)*24;
            this.startY = this.pos.y;
            break;

        case 3: 

            this.animationTimer1 = Math.PI/2*shift;
            this.centerX = x + ORBIT_DISTANCE_MIN + ORBIT_VARY;
            this.pos.x = this.centerX + Math.cos(this.animationTimer1)*ORBIT_DISTANCE_MIN;
            this.pos.y = y + Math.sin(this.animationTimer1)*ORBIT_DISTANCE_MIN;

            this.speed.zeros();
            this.target.zeros();

            break;
        
        default:
            break;
        }

        this.animationFlag = 0;
    }


    public projectileCollision(player : Player, p : Projectile, event : ProgramEvent) : boolean {


        if (!this.isActive() || !p.isActive() || !this.isInsideScreen(event))
            return false;

        if (this.overlay(p)) {

            p.kill(event);
            this.kill(event);
            
            player.addExperience(1.0);

        }
        return false;
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
    }


    public isInsideScreen = (event : ProgramEvent) : boolean => this.pos.x < event.screenWidth + 12;
}
