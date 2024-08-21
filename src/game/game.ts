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
import { Bitmap } from "../gfx/bitmap.js";


// For all kind of bars
const BAR_BACKGROUND_COLORS : string[] = ["#ffffff", "#000000", "#6d6d6d"];

const MESSAGE_TIME : number = 120;
const MESSAGE_FLICKER_TIME : number = 60;

const TRANSITION_TIME : number = 30;


const drawBar = (canvas : Canvas, dx : number, dy : number, dw : number, dh : number) : void => {

    for (let i = 0; i < 3; ++ i) {

        canvas.fillRect(dx + i, dy + i, dw - i*2, dh - i*2, BAR_BACKGROUND_COLORS[i]);
    }
}


const createScoreString = (score : number) : string => {

    const scoreStr : string = String(score);
    return "0".repeat(7 - scoreStr.length) + scoreStr;
}


const getBestScore = () : number => {

    try {

        return Number(window["localStorage"]["getItem"]("__jn") ?? 0);
    }
    catch(e){}
    return 0;
}


export class Game implements Scene {


    private background : Background;

    private stats : Stats;
    private player : Player;
    private projectiles : ObjectGenerator<Projectile>;
    private gasSupply : ObjectGenerator<GasParticle>;
    private collectibles : ObjectGenerator<Collectible>;
    private enemies : EnemyGenerator;

    private cameraPos : number = -84;
    private cameraTarget : number = 0.0;
    private globalSpeed : number = 0.0;
    private globalSpeedTarget : number = 0.0;

    private paused : boolean = false;

    private phase : number = 0;
    private phaseTimer : number = 0;

    private messageTimer : number = 0;
    private messageText : string = "";

    private bestScore : number = 0;

    private transitionTimer : number = 0;
    private fadingIn : boolean = false;

    private titleScreenActive : boolean = true;
    private cameraBottomReached : boolean = false;

    
    constructor(event : ProgramEvent) {

        this.background = new Background();

        this.stats = new Stats();
        this.projectiles = new ObjectGenerator<Projectile> (Projectile);
        this.gasSupply = new ObjectGenerator<GasParticle> (GasParticle);
        this.collectibles = new ObjectGenerator<Collectible> (Collectible);
        this.player = new Player(-16, 96, this.projectiles, this.gasSupply, this.stats);
        this.enemies = new EnemyGenerator(this.projectiles, this.gasSupply, this.collectibles);

        this.bestScore = getBestScore();
    }


    private setBestScore() : void {

        if (this.stats.score <= this.bestScore) {

            return;
        }
        this.bestScore = this.stats.score;

        try {
    
            window["localStorage"]["setItem"]("__jn", String(this.stats.score));
        }
        catch(e){}
    }


    private reset() : void {

        // Leaks a lot of memory, but do not happen too often, sooo....

        this.stats = new Stats();
        this.player = new Player(-16, 96, this.projectiles, this.gasSupply, this.stats);
        this.enemies = new EnemyGenerator(this.projectiles, this.gasSupply, this.collectibles);

        this.projectiles.flush();
        this.gasSupply.flush();
        this.collectibles.flush();

        this.messageTimer = 0;
        this.phase = 0;
        this.phaseTimer = 0;

        this.cameraPos = 0.0;
        this.cameraTarget = 0.0;
        this.globalSpeed = 0.0;
        this.globalSpeedTarget = 0.0;
    }


    private updateCamera(event : ProgramEvent) : void {

        const Y_THRESHOLD : number = 64;
        const MOVE_FACTOR : number = 8;
        const INITIAL_MOVE_SPEED : number = 2.0;

        if (!this.cameraBottomReached) {

            if ((this.cameraPos += INITIAL_MOVE_SPEED*event.tick) >= 0) {

                this.cameraPos = 0;
                this.cameraBottomReached = true;
            }
            return;
        }

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
        drawBar(canvas, dx, dy, EXPERIENCE_BAR_WIDTH, EXPERIENCE_BAR_HEIGHT);

        // Color bar
        const activeBarWidth : number = this.stats.experienceCurrent*(EXPERIENCE_BAR_WIDTH - 4);
        canvas.fillRect(dx + 2, by - 16, activeBarWidth, EXPERIENCE_BAR_HEIGHT - 4, "#6db6ff");

        if (Math.floor(this.stats.levelupFlicker/4) % 2 == 0) {

            canvas.drawText("fo", "LEVEL " + String(this.stats.level + 1), cx, by - 20, -8, 0, Align.Center);
        }
    }


    private drawTime(canvas : Canvas) : void {

        const FREEZE_BAR_WIDTH : number = 40;

        const milliseconds : number = ((this.stats.time % 1000)/10) | 0;
        const seconds : number = (this.stats.time/1000) | 0;

        canvas.drawText("fo", 
            "#" + (seconds < 10 ? "0" : "") + String(seconds) + "." + ( (milliseconds < 10 ? "0" : "") + String(milliseconds)), 
            canvas.width/2 - 5, -2, -7, 0, Align.Center);

        if (this.stats.timeFreeze <= 0)
            return;

        const dx : number = canvas.width/2 - FREEZE_BAR_WIDTH/2;
        const dy : number = 14;
        drawBar(canvas, dx, dy, FREEZE_BAR_WIDTH, 6);

        const t : number = this.stats.timeFreeze/this.stats.maxTimeFreeze;
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
        canvas.drawText("fo", createScoreString(this.stats.score), canvas.width - 44, 6, -7, 0, Align.Center);

        // Score bonus
        const bonusStr : string = (1.0 + this.stats.bonus).toFixed(1);
        canvas.drawText("fo", "BONUS: $" + bonusStr, canvas.width, canvas.height - 18, -8, 0, Align.Right);
    }


    private drawMessage(canvas : Canvas) : void {

        if (this.messageTimer < MESSAGE_FLICKER_TIME && ((this.messageTimer/4)|0) % 2 == 0) {

            return;
        } 
        canvas.drawText("fo", this.messageText, canvas.width/2, canvas.height/2 - 8, -7, 0, Align.Center);
    }


    private drawHUD(canvas : Canvas) : void {

        this.drawExperienceBar(canvas);
        this.drawTime(canvas);
        this.drawHealth(canvas);
        this.drawScore(canvas);
        this.drawMessage(canvas);
    }


    private drawGameOver(canvas : Canvas) : void {

        const cx : number = canvas.width/2;
        const cy : number = canvas.height/2;

        canvas.clear("rgba(0,0,0,0.5)");

        canvas.drawText("fo", "SCORE: " + createScoreString(this.stats.score), cx, cy + 16, - 7, 0, Align.Center);
        canvas.drawText("fo", "BEST:  " + createScoreString(this.bestScore), cx, cy + 28, - 7, 0, Align.Center);

        canvas.drawBitmap("go", Flip.None, cx - 96, 32);
    }


    private drawTitleScreen(canvas : Canvas) : void {

        const cx : number = canvas.width/2;

        // canvas.moveTo();
        canvas.clear("rgba(0,0,0,0.5)");

        if (this.messageTimer > 0.5) {

            canvas.drawText("fo", "PRESS ANY KEY", cx, canvas.height - 48, -8, 0, Align.Center);
        }
        canvas.drawText("fw", "*2024 JANI NYK@NEN", cx, canvas.height - 10, -1, 0, Align.Center);

        const bmpTitleScreen : Bitmap = canvas.getBitmap("ts")!;
        const left : number = cx - bmpTitleScreen.width/2;
        for (let i = 0; i < bmpTitleScreen.width; ++ i) {

            const dy : number = 24 + Math.sin(this.messageTimer*Math.PI*2 + i/bmpTitleScreen.width*Math.PI*4)*4;

            canvas.drawBitmap("ts", Flip.None, left + i, dy, i, 0, 1);
        }
    }

    
    // public onChange(param : SceneParameter, event : ProgramEvent): void {

        // event.transition.activate(false, TransitionType.Fade, 1.0/30.0);
    // }


    public update(event : ProgramEvent) : void {

        const GLOBAL_SPEED_DELTA : number = 1.0/60.0;
        const PHASE_LENGTH : number = 13*60;

        // NOTE: This function is way too long, but splitting it to smaller
        // functions would make me lose too many precious bytes, so...

        if (this.titleScreenActive) {

            this.messageTimer = (this.messageTimer += 1.0/60.0*event.tick) % 1.0;
            if (event.input.anyPressed) {

                this.titleScreenActive = false;
                this.messageTimer = 0;
            }
            return;
        }

        if (this.transitionTimer > 0) {

            if ((this.transitionTimer -= event.tick) <= 0) {

                if (this.fadingIn) {

                    this.reset();
                    this.transitionTimer += TRANSITION_TIME;
                }
                this.fadingIn = false;
            }
            return;
        }

        if (!this.player.doesExist()) {

            if (event.input.anyPressed) {

                this.transitionTimer = TRANSITION_TIME;
                this.fadingIn = true;
            }
            return;
        }

        const hadReachedPosition : boolean = this.player.hasReachedStartPosition()
        if (!hadReachedPosition) {
            
            this.messageText = "READY?";
            this.messageTimer = 120;
        }
        else if (event.input.getAction("p") == InputState.Pressed) {

            this.paused = !this.paused;
        }
        if (this.paused) {

            return;
        }

        if (this.cameraBottomReached && this.player.isActive()) {

            if ((this.phaseTimer += event.tick) >= PHASE_LENGTH) {

                this.phaseTimer -= PHASE_LENGTH;
                ++ this.phase;

                this.messageText = "SPEED UP!";
                this.messageTimer = MESSAGE_TIME;
            }
            this.globalSpeedTarget = 1.0 + this.phase*0.25;
        }
        this.globalSpeed = updateSpeedAxis(this.globalSpeed, this.globalSpeedTarget, GLOBAL_SPEED_DELTA*event.tick);

        this.messageTimer = Math.max(0, this.messageTimer - event.tick);

        this.player.update(this.globalSpeed, event);
        if (!hadReachedPosition && this.player.hasReachedStartPosition()) {

            this.messageText = "GO!";
        }

        this.gasSupply.update(this.globalSpeed, this.player, event);
        this.projectiles.update(this.globalSpeed, this.player, event);
        this.collectibles.update(this.globalSpeed, this.player, event);
        this.enemies.update(this.globalSpeed, this.player, event);

        this.updateCamera(event);
        this.background.update(this.globalSpeed, event);

        const oldPanicLevel : number = this.stats.panicLevel;
        this.stats.update(this.player.isActive(), event);
        if (this.stats.panicLevel != oldPanicLevel) {

            this.messageText = "PANIC UP!";
            this.messageTimer = MESSAGE_TIME;
        }

        if (this.player.isDying()) {

            this.globalSpeedTarget = 0.0;
        }
        if (!this.player.doesExist()) {

            this.setBestScore();
        }
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();

        this.background.drawBackground(canvas, this.cameraPos);

        if (this.titleScreenActive) {

            this.drawTitleScreen(canvas);
            return;
        }

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
        this.gasSupply.draw(canvas);

        this.enemies.preDraw(canvas);
        this.enemies.draw(canvas);
        this.player.draw(canvas);
        this.collectibles.draw(canvas)
        this.projectiles.draw(canvas);

        // canvas.drawBitmap("g", Flip.None, 64, 16);
        // canvas.drawBitmap("pr", Flip.None, 64, 80);
        // canvas.drawBitmap("s", Flip.None, 128, 80);

        canvas.moveTo();
        if (!this.player.doesExist()) {

            this.drawGameOver(canvas);
        }
        else {

            this.drawHUD(canvas);

            if (this.paused) {

                canvas.clear("rgba(0,0,0,0.5)");
                canvas.drawText("fo", "PAUSED", canvas.width/2, canvas.height/2 - 4, -7, 0, Align.Center);
            }
        }

        if (this.transitionTimer > 0) {

            const t : number = this.transitionTimer/TRANSITION_TIME;
            canvas.clear("rgba(0,0,0," + String(this.fadingIn ? (1.0 - t) : t) + ")");
        }
    }


    public dispose() : SceneParameter {

        return undefined;
    }
}
