import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Background } from "./background.js";
import { Flip } from "../gfx/flip.js";
import { Player } from "./player.js";
import { clamp } from "../math/utility.js";
import { updateSpeedAxis } from "./gameobject.js";
import { CAMERA_MIN_Y } from "./constants.js";
import { ProjectileGenerator } from "./projectilegenerator.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Align } from "../gfx/align.js";
import { EnemyGenerator } from "./enemygenerator.js";


const EXPRIENCE_BAR_BACKGROUND_COLORS : string[] = ["#ffffff", "#000000", "#6d6d6d"];
const EXPERIENCE_BAR_PIECES_HEIGHTS : number[] = [9, 7, 3];
const EXPERIENCE_BAR_PIECES_Y : number[] = [0, 0, 1];
const EXPERIENCE_BAR_COLORS : string[] = ["#246db6", "#6db6ff", "#92dbff"]; 


export class Game implements Scene {


    private background : Background;

    private player : Player;
    private projectiles : ProjectileGenerator;
    private enemies : EnemyGenerator;

    private cameraPos : number = 0.0;
    private cameraTarget : number = 0.0;
    private globalSpeed : number = 1.0;

    private time : number = 0.0;
    private frameCount : number = 0;
    

    constructor(event : ProgramEvent) {

        this.background = new Background();

        this.projectiles = new ProjectileGenerator();
        this.player = new Player(96, 96, this.projectiles);
        this.enemies = new EnemyGenerator();
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
        const EXPERIENCE_BAR_HEIGHT : number = 13;

        const cx : number = canvas.width/2;
        const by : number = canvas.height;

        const level : number = this.player.getLevel();

        // Experience bar background
        const dx : number = cx - EXPERIENCE_BAR_WIDTH/2;
        const dy : number = by - 10 - EXPERIENCE_BAR_HEIGHT/2;
        for (let i = 0; i < 3; ++ i) {

            canvas.setColor(EXPRIENCE_BAR_BACKGROUND_COLORS[i]);
            canvas.fillRect(dx + i, dy + i, EXPERIENCE_BAR_WIDTH - i*2, EXPERIENCE_BAR_HEIGHT - i*2);
        }

        // Bar colors
        const activeBarWidth : number = this.player.getExperienceCount()*(EXPERIENCE_BAR_WIDTH - 4);
        for (let i = 0; i < 3; ++ i) {

            const y : number = dy + 2 + EXPERIENCE_BAR_PIECES_Y[i];
            canvas.setColor(EXPERIENCE_BAR_COLORS[i]);
            canvas.fillRect(dx + 2, y, activeBarWidth, EXPERIENCE_BAR_PIECES_HEIGHTS[i]);
        }
        canvas.drawText("fw", "LEVEL " + String(level + 1), cx, by - 14, -1, 0, Align.Center);
    }


    private drawTime(canvas : Canvas) : void {

        const milliseconds : number = ((this.time % 1000)/10) | 0;
        const seconds : number = (this.time/1000) | 0;

        canvas.drawText("fo", 
            "#" + String(seconds) + ":" + ( (milliseconds < 10 ? "0" : "") + String(milliseconds)), 
            canvas.width/2, -2, -7, 0, Align.Center);
    }


    private drawHealth(canvas : Canvas) : void {

        const count : number = this.player.getHealth();

        for (let i = 0; i < this.player.maxHealth; ++ i) {

            canvas.drawBitmap("h", Flip.None, 2 + 16*i, 2, i < count ? 0 : 16, 0, 16, 16);
        }
    }


    private drawHUD(canvas : Canvas) : void {

        this.drawExperienceBar(canvas);
        this.drawTime(canvas);
        this.drawHealth(canvas);

        // A lonely phase text on the top-right corner
        canvas.drawText("fo", "PHASE 1", canvas.width + 2, -2, -7, 0, Align.Right);
    }

    
    public onChange(param : SceneParameter, event : ProgramEvent): void {

        // event.transition.activate(false, TransitionType.Fade, 1.0/30.0);
    }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive()) {

            return;
        }

        this.player.update(event);
        this.projectiles.update(this.player, event);
        this.enemies.update(this.player, this.projectiles, event);

        this.updateCamera(event);
        this.background.update(this.globalSpeed, event);

        this.time += this.frameCount == 0 ? 16 : 17;
        if (this.time >= 13*1000) {

            this.time = 13*1000;
            // TODO: Kill the player
        }
        this.frameCount = (this.frameCount + 1) % 3;
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();

        // Note: camera is activated in this function
        this.background.draw(canvas, this.cameraPos);

        // Shadows
        canvas.setColor("rgba(0, 0, 0, 0.33)");
        this.player.drawShadow(canvas);

        // Objects
        this.player.preDraw(canvas);
        this.enemies.preDraw(canvas);
        this.enemies.draw(canvas);
        this.player.draw(canvas);
        this.projectiles.draw(canvas);

        // canvas.drawBitmap("e", Flip.None, 64, 16);
        // canvas.drawBitmap("p", Flip.None, 64, 80);
        // canvas.drawBitmap("s", Flip.None, 128, 80);

        canvas.moveTo();
        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {

        return undefined;
    }
}
