import { Assets } from "./assets.js";
import { ProgramEvent } from "./event.js";
import { Canvas } from "../gfx/canvas.js";
import { Input } from "./input.js";
// import { SceneManager } from "./scenemanager.js";
import { Transition } from "./transition.js";
import { AudioPlayer } from "../audio/audioplayer.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Sample } from "../audio/sample.js";
import { Scene } from "./scene.js";


export class Program {


    private input : Input;
    private canvas : Canvas;

    // private scenes : SceneManager;
    private activeScene : Scene;

    private assets : Assets;
    private transition : Transition;
    private audio : AudioPlayer;
    private event : ProgramEvent;
    
    private timeSum : number = 0.0;
    private oldTime : number = 0.0;

    private initialized : boolean = false;

    private animationRequest : number | undefined = undefined;


    constructor(canvasMinWidth : number,  canvasMaxWidth : number,
        canvasMinHeight : number,  canvasMaxHeight : number,
        audioCtx : AudioContext, audioMaxVolume : number = 0.60) {
        
        this.input = new Input();
        // this.scenes = new SceneManager();
        this.assets = new Assets();
        this.transition = new Transition();
        this.audio = new AudioPlayer(audioCtx, 
            (name : string) : Sample | undefined => this.assets.getSample(name), 
            audioMaxVolume);

        this.canvas = new Canvas(null,
            canvasMinWidth, canvasMinHeight,
            canvasMaxWidth, canvasMaxHeight,
            (name : string) : Bitmap => this.assets.getBitmap(name), true);
        this.event = new ProgramEvent(this.input,  /*this.scenes*/ this.assets, this.canvas, this.transition, this.audio); 
    }


    private drawLoadingScreen(canvas : Canvas) : void {

        const OUTLINE : number = 1;
        const WIDTH : number  = 80;
        const HEIGHT : number  = 12;

        canvas.clear("#000000");
/*
        const p : number = this.assets.loadedRatio();

        const dx : number = canvas.width/2 - WIDTH/2;
        const dy : number = canvas.height/2 - HEIGHT/2;

        canvas.setColor("#ffffff");
        canvas.fillRect(dx, dy, WIDTH, HEIGHT);
        canvas.setColor("#000000");
        canvas.fillRect(dx + OUTLINE, dy + OUTLINE, WIDTH - OUTLINE*2, HEIGHT - OUTLINE*2);
        canvas.setColor("#ffffff");
        canvas.fillRect(dx + OUTLINE*2, dy + OUTLINE*2, (WIDTH - OUTLINE*4)*p, HEIGHT - OUTLINE*4);
        */
    }


    private loop(ts : number, onLoad? : (event : ProgramEvent) => void) : void {

        const MAX_REFRESH_COUNT : number = 5; 
        const BASE_FRAME_TIME : number = 1000.0/60.0;
    
        const frameTime : number = BASE_FRAME_TIME*this.event.tick;
        const loaded : boolean = this.assets.loaded();

        this.timeSum = Math.min(this.timeSum + (ts - this.oldTime), MAX_REFRESH_COUNT*frameTime);
        this.oldTime = ts;

        try {

            if (loaded && !this.initialized) {

                onLoad?.(this.event);
                // this.scenes.activeScene?.onChange?.(undefined, this.event);
                this.initialized = true;
            }

            let firstFrame : boolean = true;
            for (; this.timeSum >= frameTime; this.timeSum -= frameTime) {

                if (loaded) {

                    // this.scenes.activeScene?.update(this.event);
                    this.activeScene.update(this.event);
                    this.transition.update(this.event);
                }
                
                if (firstFrame) {

                    this.event.input.update();
                    firstFrame = false;
                }
            }
            
            if (loaded) {
                
                // this.scenes.activeScene?.redraw(this.canvas);
                this.activeScene.redraw(this.canvas);
                this.transition.draw(this.canvas);
            }
            else {

                this.drawLoadingScreen(this.canvas);
            }
        }
        catch (e : any) {

            if (this.animationRequest !== undefined) {

                window.cancelAnimationFrame(this.animationRequest);
            }
            console.log(e.stack);
            return;
        }

        this.animationRequest = window.requestAnimationFrame(ts => this.loop(ts, onLoad));
    }


    public run(sceneType : Function,
        initialEvent? : (event : ProgramEvent) => void,
        onLoad? : (event : ProgramEvent) => void) : void {

        this.activeScene = new sceneType.prototype.constructor(this.event);

        initialEvent?.(this.event);
        this.loop(0.0, onLoad);
    }
}
