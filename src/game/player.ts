import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { clamp } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { Collectible } from "./collectible.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { next } from "./existingobject.js";
import { GameObject, updateSpeedAxis } from "./gameobject.js";
import { GasParticle } from "./gasparticle.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Projectile } from "./projectile.js";
import { Stats } from "./stats.js";


const ANGLE_MAX : number = 4.0;
const SHOOT_RECOVER_TIME : number = 17.0;
const BULLET_COUNT : number[][] = [[1, 1], [2, 1], [2, 2], [3, 2], [3, 3]];
const DEATH_TIME : number = 90;

const HURT_TIME : number = 60;
const SHAKE_TIME : number = 30;


export class Player extends GameObject {


    private angle : number = 0.0;
    private angleTarget : number = 0.0;

    private gasTimer : number = 0.0;

    private shootCount : number = 0;
    private shootRecoverTimer : number = 0.0;

    private hurtTimer : number = 0.0;
    private shakeTimer : number = 0;

    private deathTimer : number = 0;

    private startPositionReached : boolean = false;
    
    private readonly projectiles : ObjectGenerator<Projectile>;
    private readonly gasSupply : ObjectGenerator<GasParticle>;

    public readonly stats : Stats;


    constructor(x : number, y : number, 
        projectiles : ObjectGenerator<Projectile>,
        gasSupply : ObjectGenerator<GasParticle>,
        stats : Stats) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 2, 24, 16);

        this.friction = new Vector(0.2, 0.2);
    
        this.gasSupply = gasSupply;
        this.projectiles = projectiles;
        this.stats = stats;
    }


    private shoot(event : ProgramEvent) : void {

        const BULLET_ANGLE : number = Math.PI/10;
        const BULLET_SPEED : number = 4.0;

        const count : number = BULLET_COUNT[this.stats.level][this.shootCount];
        const startAngle: number = -BULLET_ANGLE*(count - 1)/2;

        event.playSample("b0");

        for (let i = 0; i < count; ++ i) {

            const angle : number = startAngle + i*BULLET_ANGLE;

            const speedx : number = Math.cos(angle)*BULLET_SPEED;
            const speedy : number = Math.sin(angle)*BULLET_SPEED;

            this.projectiles.next().spawn(
                this.pos.x + 14, this.pos.y + 4 + this.angleTarget,
                speedx + this.speed.x/2, speedy + this.speed.y/2, 0);
        }

        this.shootRecoverTimer = SHOOT_RECOVER_TIME;

        this.shootCount = (this.shootCount + 1) % 2;
    }


    private control(event : ProgramEvent) : void {

        const BASE_MOVE_SPEED : number = 2.5;
        const dir : Vector = new Vector();

        if ((event.getAction("l") & InputState.DownOrPressed) != 0) {

            dir.x = -1;
        }
        else if ((event.getAction("r") & InputState.DownOrPressed) != 0) {

            dir.x = 1;
        }

        if ((event.getAction("u") & InputState.DownOrPressed) != 0) {

            dir.y = -1;
        }
        else if ((event.getAction("d") & InputState.DownOrPressed) != 0) {

            dir.y = 1;
        }
        dir.normalize();

        const moveSpeed : number = BASE_MOVE_SPEED + (this.stats.panicLevel*0.5);
        const friction : number = 0.2 + this.stats.panicLevel*0.05;

        this.friction.x = friction;
        this.friction.y = friction;

        this.target.x = dir.x*moveSpeed;
        this.target.y = dir.y*moveSpeed;

        this.angleTarget = dir.y*ANGLE_MAX;

        if ((event.getAction("s") & InputState.DownOrPressed) != 0 && 
            this.shootRecoverTimer <= 0.0) {

            this.shoot(event);
        }
    }


    private checkBorders(event : ProgramEvent) : void {

        const left : number = this.hitbox.x + this.hitbox.w/2;
        const right : number = event.screenWidth - this.hitbox.w/2 + this.hitbox.x;
        const top : number = CAMERA_MIN_Y + this.hitbox.y + this.hitbox.h/2;

        if ((this.speed.x < 0 && this.pos.x <= left) || (this.speed.x > 0 && this.pos.x >= right)) {

            this.speed.x = 0;
        }
        this.pos.x = clamp(this.pos.x, left, right);

        if (this.speed.y < 0 && this.pos.y < top) {

            this.speed.y = 0;
            this.pos.y = top;

            this.angleTarget = 0.0;
        }
    }


    private updateGas(event : ProgramEvent) : void {

        const GAS_TIME : number = 6.0;

        if ((this.gasTimer -= event.tick) <= 0) {

            this.gasTimer += GAS_TIME;
            this.gasSupply.next().spawn(this.pos.x - 16, this.pos.y + 4 - this.angle, -2.0 + this.speed.x, this.speed.y/2, 0);
        }
    }


    private drawDeath(canvas : Canvas) : void {

        const MAX_DISTANCE : number = 96;
        const COLORS : string[] = ["#ff6d00", "#ffb600" ,"#ffffb6"];

        const distance : number = this.deathTimer/DEATH_TIME*MAX_DISTANCE;

        for (let i = 0; i < 8; ++ i) {

            const angle : number = Math.PI*2/8*i;

            const dx : number = this.pos.x + Math.cos(angle)*distance;
            const dy : number = this.pos.y + Math.sin(angle)*distance;

            for (let j = 0; j < 3; ++ j) {

                canvas.setColor(COLORS[(j + ((((this.deathTimer/3) | 0)) % 3)) % 3]);
                canvas.fillEllipse(dx, dy, 8 - j*3);
            }
        }   
    }


    protected updateEvent(globalSpeed : number, event : ProgramEvent) : void {

        const INITIAL_SPEED : number = 1.5;
        const START_POS : number = 96;

        this.updateGas(event);
        if (!this.startPositionReached) {

            if ((this.pos.x += INITIAL_SPEED*event.tick) >= START_POS) {

                this.pos.x = START_POS;
                this.startPositionReached = true;
            }
            return;
        }

        this.control(event);
        

        if (this.shootRecoverTimer > 0) {

            this.shootRecoverTimer -= (1.0 + this.stats.panicLevel*0.25)*event.tick;
        }

        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }

        this.shakeTimer = (this.shakeTimer + event.tick) % 4;

        if (this.stats.health <= 0 || this.stats.time <= 0) {

            this.dying = true;
            this.deathTimer = 0;

            event.playSample("d");
        }
    }


    protected die(event : ProgramEvent) : boolean {

        this.hurtTimer -= event.tick;

        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }


    protected postMovementEvent(event : ProgramEvent) : void {
        
        const ANGLE_FRICTION : number = 0.25;

        if (this.startPositionReached) {

            this.checkBorders(event);
        }
        this.angle = updateSpeedAxis(this.angle, this.angleTarget, ANGLE_FRICTION*event.tick);
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.angleTarget = 0.0
    }


    public draw(canvas : Canvas) : void {
        
        const MUZZLE_FLASH_TIME : number = 12;

        if (!this.exist) {

            return;
        }

        if (this.dying) {

            this.drawDeath(canvas);
            return;
        }

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 != 0) {

            return;
        }

        let dx : number = this.pos.x - 16;
        let dy : number = this.pos.y - 12;

        if (this.stats.panicLevel > 0 &&
            ((this.shakeTimer/2) | 0) % 2 == 0) {

            dx += -this.stats.panicLevel + ((Math.random()*(1 + this.stats.panicLevel*2)) | 0);
            dy += -this.stats.panicLevel + ((Math.random()*(1 + this.stats.panicLevel*2)) | 0);
        }

        const angleStep : number = Math.round(this.angle);
        const angleRamp : number = (32/(1.0 + Math.abs(angleStep))) | 0;
        const dir : number = Math.sign(angleStep);
        const shifty : number = -(dir < 0 ? Math.floor : Math.ceil)(angleStep/2);

        let y : number = 0;
        for (let x : number = 0; x < 32; x += angleRamp) {
            
            y += Math.sign(angleStep);

            canvas.drawBitmap("p", Flip.None, dx + x, dy + shifty + y, x, 0, angleRamp, 24);
        }

        // Draw the muzzle flash
        if (this.shootRecoverTimer > SHOOT_RECOVER_TIME - MUZZLE_FLASH_TIME) {

            const t : number = 1.0 - (this.shootRecoverTimer - SHOOT_RECOVER_TIME + MUZZLE_FLASH_TIME )/MUZZLE_FLASH_TIME;
            canvas.drawBitmap("r1", Flip.None, this.pos.x + 2, this.pos.y - 8 + angleStep, ((t*4) | 0)*24, 0, 24, 24);
            return;
        }
    }


    public scoreKill(points : number) : void {

        const BASE_EXPERIENCE : number = 1.0;

        this.stats.experienceTarget += (BASE_EXPERIENCE/(8*(1 + this.stats.level*2)));
        this.stats.addPoints(points);
        this.stats.bonus += 0.1;
    }


    public hurt(event : ProgramEvent) : void {

        if (this.hurtTimer > 0) {

            return;
        }
        
        

        if ((-- this.stats.health) > 0) {

            event.playSample("h");
        }
        this.hurtTimer = HURT_TIME;

        this.stats.loseLevel();
    }


    public isShooting = () : boolean => this.shootRecoverTimer > 0;
    public hasReachedStartPosition = () : boolean => this.startPositionReached;
    public shaking = () : boolean => this.hurtTimer > SHAKE_TIME;
}
