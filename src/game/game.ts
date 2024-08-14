import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Background } from "./background.js";
import { Flip } from "../gfx/flip.js";
import { Player } from "./player.js";
import { clamp } from "../math/utility.js";
import { updateSpeedAxis } from "./gameobject.js";
import { CAMERA_MIN_Y } from "./constants.js";


export class Game implements Scene {


    private background : Background;
    private player : Player;
    private cameraPos : number = 0.0;
    private cameraTarget : number = 0.0;

    private globalSpeed : number = 1.0;


    constructor(event : ProgramEvent) {

        this.background = new Background();

        this.player = new Player(96, 96);
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

    
    public onChange(param : SceneParameter, event : ProgramEvent): void {

        // event.transition.activate(false, TransitionType.Fade, 1.0/30.0);
    }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive()) {

            return;
        }

        this.player.update(event);
        this.updateCamera(event);
        this.background.update(this.globalSpeed, event);
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();

        this.background.draw(canvas, this.cameraPos);

        // Shadows
        canvas.setColor("rgba(0, 0, 0, 0.33)");
        this.player.drawShadow(canvas);

        // Objects
        this.player.preDraw(canvas);
        this.player.draw(canvas);

        // canvas.drawBitmap("gp", Flip.None, 64, 16);
        //canvas.drawBitmap("p", Flip.None, 64, 80);
        //canvas.drawBitmap("s", Flip.None, 128, 80);

        // canvas.moveTo();
        // canvas.drawText("fw", "HELLO WORLD!", 2, 2);
    }


    public dispose() : SceneParameter {

        return undefined;
    }
}
