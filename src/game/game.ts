import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Background } from "./background.js";
import { Flip } from "../gfx/flip.js";
import { Player } from "./player.js";
import { clamp } from "../math/utility.js";
import { updateSpeedAxis } from "./gameobject.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Align } from "../gfx/align.js";
import { EnemyGenerator } from "./enemygenerator.js";
import { Projectile } from "./projectile.js";
import { GasParticle } from "./gasparticle.js";
import { InputState } from "../core/inputstate.js";
import { Collectible } from "./collectible.js";
import { Stats } from "./stats.js";


// For all kind of bars
const BAR_BACKGROUND_COLORS : string[] = ["#ffffff", "#000000", "#6d6d6d"];

const EXPERIENCE_BAR_PIECES_HEIGHTS : number[] = [11, 9, 4];
const EXPERIENCE_BAR_PIECES_Y : number[] = [0, 0, 1];
const EXPERIENCE_BAR_COLORS : string[] = ["#006db6", "#6db6ff", "#92dbff"]; 


export class Game implements Scene {


    private background : Background;

    private stats : Stats;
    private player : Player;
    private projectiles : ObjectGenerator<Projectile>;
    private gasSupply : ObjectGenerator<GasParticle>;
    private collectibles : ObjectGenerator<Collectible>;
    private enemies : EnemyGenerator;

    private cameraPos : number = 0.0;
    private cameraTarget : number = 0.0;
    private globalSpeed : number = 1.0;

    private paused : boolean = false;

    
    constructor(event : ProgramEvent) {

        this.background = new Background();

        this.stats = new Stats();
        this.projectiles = new ObjectGenerator<Projectile> (Projectile);
        this.gasSupply = new ObjectGenerator<GasParticle> (GasParticle);
        this.collectibles = new ObjectGenerator<Collectible> (Collectible);
        this.player = new Player(96, 96, this.projectiles, this.gasSupply, this.stats);
        this.enemies = new EnemyGenerator(this.projectiles, this.gasSupply, this.collectibles);
    }


    private updateCamera(event : ProgramEvent) : void {

        const Y_THRESHOLD : number = 64;
        const MOVE_FACTOR : number = 8;

        const py : number = this.player.getPosition().y;

        if (py < this.cameraPos + Y_THRESHOLD) {

            this.cameraTarget = py - Y_THRESHOLD;
        }
        else if (py > this.cameraPos + event.screenHeight - Y_THRESHOLD) {

            this.cameraTarget = py - event.screenHeight + Y_THRESHOLD;
        }

        this.cameraPos = updateSpeedAxis(this.cameraPos, 
            this.cameraTarget, 
            (Math.abs(this.cameraPos - this.cameraTarget)/MOVE_FACTOR)*event.tick);

        this.cameraPos = clamp(this.cameraPos, CAMERA_MIN_Y, 0);
    }


    private drawExperienceBar(canvas : Canvas) : void {

        const EXPERIENCE_BAR_WIDTH : number = 96;
        const EXPERIENCE_BAR_HEIGHT : number = 15;

        const cx : number = canvas.width/2;
        const by : number = canvas.height;

        // Experience bar background
        const dx : number = cx - EXPERIENCE_BAR_WIDTH/2;
        const dy : number = by - 10 - EXPERIENCE_BAR_HEIGHT/2;
        for (let i = 0; i < 3; ++ i) {

            canvas.fillRect(dx + i, dy + i, EXPERIENCE_BAR_WIDTH - i*2, EXPERIENCE_BAR_HEIGHT - i*2, BAR_BACKGROUND_COLORS[i]);
        }

        // Bar colors
        const activeBarWidth : number = this.stats.experienceCurrent*(EXPERIENCE_BAR_WIDTH - 4);
        for (let i = 0; i < 3; ++ i) {

            const y : number = dy + 2 + EXPERIENCE_BAR_PIECES_Y[i];
            canvas.fillRect(dx + 2, y, activeBarWidth, EXPERIENCE_BAR_PIECES_HEIGHTS[i], EXPERIENCE_BAR_COLORS[i]);
        }
        canvas.drawText("fo", "LEVEL " + String(this.stats.level + 1), cx, by - 20, -8, 0, Align.Center);
    }


    private drawTime(canvas : Canvas) : void {

        const FREEZE_BAR_WIDTH : number = 40;

        const milliseconds : number = ((this.stats.time % 1000)/10) | 0;
        const seconds : number = (this.stats.time/1000) | 0;

        canvas.drawText("fo", 
            "#" + String(seconds) + ":" + ( (milliseconds < 10 ? "0" : "") + String(milliseconds)), 
            canvas.width/2 - 5, -2, -7, 0, Align.Center);

        if (this.stats.timeFreeze <= 0)
            return;

        const t : number = this.stats.timeFreeze/this.stats.maxTimeFreeze;
        const dx : number = canvas.width/2 - FREEZE_BAR_WIDTH/2;
        const dy : number = 14;
        for (let i = 0; i < 3; ++ i) {

            canvas.fillRect(dx + i, dy + i, FREEZE_BAR_WIDTH - i*2, 6 - i*2, BAR_BACKGROUND_COLORS[i]);
        }
        
        canvas.fillRect(dx + 2, dy + 2, t*(FREEZE_BAR_WIDTH - 4), 2, "#ffffff");
    }


    private drawHealth(canvas : Canvas) : void {

        for (let i = 0; i < this.stats.maxHealth; ++ i) {

            canvas.drawBitmap("h", Flip.None, 2 + 16*i, 2, i < this.stats.health ? 0 : 16, 0, 16, 16);
        }
    }


    private drawScore(canvas : Canvas) : void {

        // Score
        canvas.drawText("fo", "SCORE:", canvas.width - 8, -4, -8, 0, Align.Right);

        const scoreStr : string = String(this.stats.score);
        const finalScoreStr : string = "0".repeat(7 - scoreStr.length) + scoreStr;
        canvas.drawText("fo", finalScoreStr, canvas.width - 44, 6, -7, 0, Align.Center);

        // Score bonus
        const bonusStr : string = (1.0 + this.stats.bonus).toFixed(1);
        canvas.drawText("fo", "BONUS: $" + bonusStr, canvas.width, canvas.height - 18, -8, 0, Align.Right);
    }


    private drawHUD(canvas : Canvas) : void {

        this.drawExperienceBar(canvas);
        this.drawTime(canvas);
        this.drawHealth(canvas);
        this.drawScore(canvas);
    }

    
    // public onChange(param : SceneParameter, event : ProgramEvent): void {

        // event.transition.activate(false, TransitionType.Fade, 1.0/30.0);
    // }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive()) {

            return;
        }

        if (event.input.getAction("p") == InputState.Pressed) {

            this.paused = !this.paused;
        }
        if (this.paused) {

            return;
        }

        this.player.update(event);
        this.projectiles.iterate((p : Projectile) : void => {

            this.player.projectileCollision(p, event);
        });
        this.collectibles.iterate((c : Collectible) : void => {

            this.player.collectibleCollision(c, event);
        })

        this.gasSupply.update(event);
        this.projectiles.update(event);
        this.collectibles.update(event);
        this.enemies.update(this.player, event);

        this.updateCamera(event);
        this.background.update(this.globalSpeed, event);

        this.stats.update(event);
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();

        this.background.drawBackground(canvas, this.cameraPos);

        canvas.moveTo(0, -this.cameraPos);
        this.background.drawGround(canvas);
        
        // Shadows
        this.player.drawShadow(canvas);
        this.enemies.drawShadows(canvas);
        this.collectibles.drawShadows(canvas);

        canvas.setAlpha(0.25);
        this.background.drawGround(canvas, false);
        canvas.setAlpha();

        // Objects
        this.gasSupply.draw(canvas, canvas.getBitmap("gp"));

        this.enemies.preDraw(canvas);
        this.enemies.draw(canvas);
        this.player.draw(canvas);
        this.collectibles.draw(canvas, canvas.getBitmap("cl"))
        this.projectiles.draw(canvas, canvas.getBitmap("pr"));

        // canvas.drawBitmap("g", Flip.None, 64, 16);
        // canvas.drawBitmap("pr", Flip.None, 64, 80);
        // canvas.drawBitmap("s", Flip.None, 128, 80);

        canvas.moveTo();
        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {

        return undefined;
    }
}
