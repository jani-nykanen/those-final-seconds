import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";
import { Rectangle } from "../math/rectangle.js";
import { clamp } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { next } from "./existingobject.js";
import { GameObject, updateSpeedAxis } from "./gameobject.js";
import { GasParticle } from "./gasparticle.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Projectile } from "./projectile.js";


const ANGLE_MAX : number = 4.0;
const SHOOT_RECOVER_TIME : number = 16.0;


export class Player extends GameObject {


    private angle : number = 0.0;
    private angleTarget : number = 0.0;

    private gasTimer : number = 0.0;

    private shootRecoverTimer : number = 0.0;
    private level : number = 0;
    private experienceTarget : number = 0.0;
    private experienceCurrent : number = 0.0;

    private health : number = 3;
    private hurtTimer : number = 0.0;
    
    private readonly projectiles : ObjectGenerator<Projectile>;
    private readonly gasSupply : ObjectGenerator<GasParticle>;

    public readonly maxHealth : number = 3;


    constructor(x : number, y : number, 
        projectiles : ObjectGenerator<Projectile>,
        gasSupply : ObjectGenerator<GasParticle>) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 2, 24, 16);

        this.friction = new Vector(0.15, 0.15);
    
        this.gasSupply = gasSupply;
        this.projectiles = projectiles;
    }


    private shoot(event : ProgramEvent) : void {

        const BULLET_ANGLE : number = Math.PI/10;
        const BULLET_SPEED : number = 4.0;

        const count : number = Math.min(5, 1 + this.level);
        const startAngle: number = -BULLET_ANGLE*(count - 1)/2;

        for (let i = 0; i < count; ++ i) {

            const angle : number = startAngle + i*BULLET_ANGLE;

            const speedx : number = Math.cos(angle)*BULLET_SPEED;
            const speedy : number = Math.sin(angle)*BULLET_SPEED;

            this.projectiles.next().spawn(
                this.pos.x + 14, this.pos.y + 4 + this.angleTarget,
                speedx + this.speed.x/2, speedy + this.speed.y/2, 0);
        }

        this.shootRecoverTimer = SHOOT_RECOVER_TIME;
    }


    private control(event : ProgramEvent) : void {

        const MOVE_SPEED : number = 2.0;
        const dir : Vector = new Vector();

        if ((event.input.getAction("l") & InputState.DownOrPressed) != 0) {

            dir.x = -1;
        }
        else if ((event.input.getAction("r") & InputState.DownOrPressed) != 0) {

            dir.x = 1;
        }

        if ((event.input.getAction("u") & InputState.DownOrPressed) != 0) {

            dir.y = -1;
        }
        else if ((event.input.getAction("d") & InputState.DownOrPressed) != 0) {

            dir.y = 1;
        }
        dir.normalize();

        this.target.x = dir.x*MOVE_SPEED;
        this.target.y = dir.y*MOVE_SPEED;

        this.angleTarget = dir.y*ANGLE_MAX;

        if ((event.input.getAction("s") & InputState.DownOrPressed) != 0 && 
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
            this.gasSupply.next().spawn(this.pos.x - 16, this.pos.y + 4 + this.angle, -2.0 + this.speed.x, this.speed.y/2, 0);
        }
    }


    private updateExperience(event : ProgramEvent) : void {

        if (this.level == 4) {

            this.experienceCurrent = 0.0;
            this.experienceTarget = 0.0;
            return;
        }

        this.experienceCurrent = updateSpeedAxis(this.experienceCurrent, this.experienceTarget, 1.0/60.0*event.tick);
        if (this.experienceCurrent >= 1.0 && 
            this.experienceTarget >= 1.0) {

            ++ this.level;
            this.experienceTarget -= 1.0;
            this.experienceCurrent -= 1.0;
        }
    }


    protected updateEvent(event : ProgramEvent) : void {

        this.control(event);
        this.updateGas(event);
        this.updateExperience(event);

        if (this.shootRecoverTimer > 0) {

            this.shootRecoverTimer -= event.tick;
        }

        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }
    }


    protected postMovementEvent(event : ProgramEvent) : void {
        
        const ANGLE_FRICTION : number = 0.25;

        this.checkBorders(event);
        this.angle = updateSpeedAxis(this.angle, this.angleTarget, ANGLE_FRICTION*event.tick);
    }


    protected groundCollisionEvent(event : ProgramEvent) : void {
        
        this.angleTarget = 0.0
    }


    public preDraw(canvas : Canvas) : void {

        const bmpGasParticle : Bitmap = canvas.getBitmap("gp");
    }


    public draw(canvas : Canvas) : void {
        
        const MUZZLE_FLASH_TIME : number = 12;

        if (!this.exist) {

            return;
        }

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 != 0) {

            return;
        }

        const dx : number = this.pos.x - 16;
        const dy : number = this.pos.y - 12;

        const angleStep : number = Math.round(this.angle);
        const angleRamp : number = (32/(1.0 + Math.abs(angleStep))) | 0;
        const dir : number = Math.sign(angleStep);
        const shifty : number = -(dir < 0 ? Math.floor : Math.ceil)(angleStep/2);

        const bmp : Bitmap = canvas.getBitmap("p");
        let y : number = 0;
        for (let x : number = 0; x < 32; x += angleRamp) {
            
            y += Math.sign(angleStep);

            canvas.drawBitmap(bmp, Flip.None, dx + x, dy + shifty + y, x, 0, angleRamp, 24);
        }

        // Draw the muzzle flash
        if (this.shootRecoverTimer > SHOOT_RECOVER_TIME - MUZZLE_FLASH_TIME) {

            const t : number = 1.0 - (this.shootRecoverTimer - SHOOT_RECOVER_TIME + MUZZLE_FLASH_TIME )/MUZZLE_FLASH_TIME;
            canvas.setColor("#ffdb00");
            canvas.fillRing(this.pos.x + 15, this.pos.y + 4 + angleStep, 8*t, 4 + 5*t);
            return;
        }
    }


    public addExperience(multiplier : number = 1.0) : void {

        const BASE_EXPERIENCE : number = 1.0;

        this.experienceTarget += (BASE_EXPERIENCE/(4*(this.level + 1)))*multiplier;
    }


    public hurt(event : ProgramEvent) : void {

        const HURT_TIME : number = 60;

        if (this.hurtTimer > 0) {

            return;
        }

        if ((-- this.health) <= 0) {

            // TODO: Kill
        }

        this.hurtTimer = HURT_TIME;
    }


    public projectileCollision(p : Projectile, event : ProgramEvent) : void {

        if (!this.isActive() || !p.isActive() || p.isFriendly())
            return;

        if (this.overlay(p)) {

            this.hurt(event);
            p.kill(event);
        }
    }


    public getLevel = () : number => this.level;
    public getExperienceCount = () : number => this.experienceCurrent;
    public getHealth = () : number => this.health;
    public isShooting = () : boolean => this.shootRecoverTimer > 0;
}
