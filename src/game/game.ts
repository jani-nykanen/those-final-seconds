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


const OVERHEAT_BAR_BASE_COLORS : string[] = ["#ffffff", "#000000", "#6d6d6d"];
const OVERHEAT_BAR_PIECES_HEIGHTS : number[] = [11, 9, 4];
const OVERHEAT_BAR_PIECES_Y : number[] = [0, 0, 2];


export class Game implements Scene {


    private background : Background;

    private player : Player;
    private projectiles : ProjectileGenerator;

    private cameraPos : number = 0.0;
    private cameraTarget : number = 0.0;
    private globalSpeed : number = 1.0;

    

    constructor(event : ProgramEvent) {

        this.background = new Background();

        this.projectiles = new ProjectileGenerator();
        this.player = new Player(96, 96, this.projectiles);
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


    private computeOverheatBarColors(level : number) : string[] {

        const START_COLORS : number[][] = [
            [36, 109, 0],
            [109, 182, 0],
            [182, 255, 0],
        ];
        const TARGET_COLORS : number[][] = [
            [109, 0, 0],
            [219, 73, 0],
            [255, 109, 73],
        ];

        const t : number = 1.0 - Math.min(1.0, level/13);

        const out : [number[], number[], number[]] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        let result : string[] = [];
        for (let i = 0; i < 3; ++ i) {

            for (let j = 0; j < 3; ++ j) {

                out[i][j] = Math.round(START_COLORS[i][j]*t + (1.0 - t)*TARGET_COLORS[i][j]);
            }
            result[i] = "rgb(" + String(out[i][0]) + "," + String(out[i][1]) + "," + String(out[i][2]) + ")";
        }
        return result;
    }


    private drawHUD(canvas : Canvas) : void {

        const OVERHEAT_BOTTOM_OFFSET : number = 20;
        const OVERHEAT_BAR_WIDTH : number = 96;
        const OVERHEAT_BAR_HEIGHT : number = 15;

        const fontOutlines : Bitmap = canvas.getBitmap("fo");

        const cx : number = canvas.width/2;
        const by : number = canvas.height;

        const level : number = this.player.getOverheatLevel();

        // Overheat bar background
        const dx : number = cx - OVERHEAT_BAR_WIDTH/2;
        const dy : number = by - OVERHEAT_BOTTOM_OFFSET/2 - OVERHEAT_BAR_HEIGHT/2;
        for (let i = 0; i < 3; ++ i) {

            canvas.setColor(OVERHEAT_BAR_BASE_COLORS[i]);
            canvas.fillRect(dx + i, dy + i, OVERHEAT_BAR_WIDTH - i*2, OVERHEAT_BAR_HEIGHT - i*2);
        }

        // Bar colors
        const colors : string[] = this.computeOverheatBarColors(level);
        const activeBarWidth : number = this.player.getOverheatBar()*(OVERHEAT_BAR_WIDTH - 4);
        for (let i = 0; i < 3; ++ i) {

            const y : number = dy + 2 + OVERHEAT_BAR_PIECES_Y[i];
            canvas.setColor(colors[i]);
            canvas.fillRect(dx + 2, y, activeBarWidth, OVERHEAT_BAR_PIECES_HEIGHTS[i]);
        }

        // Overheat text
        canvas.drawText(fontOutlines, "OVERHEAT: ", cx - 96, by - OVERHEAT_BOTTOM_OFFSET, -7, 0, Align.Center);
        canvas.drawText(fontOutlines,  String(level) + "/13", cx, by - OVERHEAT_BOTTOM_OFFSET, -7, 0, Align.Center);
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

        this.updateCamera(event);
        this.background.update(this.globalSpeed, event);
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
        this.player.draw(canvas);
        this.projectiles.draw(canvas);

        // canvas.drawBitmap("pr", Flip.None, 64, 16);
        // canvas.drawBitmap("p", Flip.None, 64, 80);
        // canvas.drawBitmap("s", Flip.None, 128, 80);

        canvas.moveTo();
        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {

        return undefined;
    }
}
