import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Background } from "./background.js";
import { Flip } from "../gfx/flip.js";
import { Player } from "./player.js";


export class Game implements Scene {


    private background : Background;
    private player : Player;

    private globalSpeed : number = 1.0;


    constructor(event : ProgramEvent) {

        this.background = new Background();

        this.player = new Player(96, 96);
    }

    
    public onChange(param : SceneParameter, event : ProgramEvent): void {

        // event.transition.activate(false, TransitionType.Fade, 1.0/30.0);
    }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive()) {

            return;
        }

        this.player.update(event);
        this.background.update(this.globalSpeed, event);
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();

        this.background.draw(canvas);

        // Shadows
        canvas.setColor("rgba(0, 0, 0, 0.33)");
        this.player.drawShadow(canvas);

        // Objects
        this.player.draw(canvas);

        // canvas.drawBitmap("p", Flip.None, 64, 16);
        //canvas.drawBitmap("p", Flip.None, 64, 80);
        //canvas.drawBitmap("s", Flip.None, 128, 80);

        canvas.moveTo();
        canvas.drawText("fw", "HELLO WORLD!", 2, 2);
    }


    public dispose() : SceneParameter {

        return undefined;
    }
}
