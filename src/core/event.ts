import { Bitmap, Canvas } from "../gfx/canvas.js";
import { Ramp, Sample } from "./sample.js";


export const enum InputState {

    Up = 0,
    Down = 1,
    Released = 2,
    Pressed = 3,

    DownOrPressed = 1,
}



export class ProgramEvent {


    private readonly canvas : Canvas;

    public readonly tick : number = 1.0;

    // Input
    private keys : Map<string, InputState>;
    private preventedKeys : Array<string>;
    private actions : Map<string, string[]>;
    private anyKeyPressed : boolean = false;

    // Asset manager
    private loadCount : number = 0;
    private assetCount : number = 0;
    private bitmaps : Map<string, Bitmap>;
    private samples : Map<string, Sample>;

    // Audio player
    private ctx : AudioContext | undefined = undefined;
    private globalVolume : number;


    public get screenWidth() : number {

        return this.canvas.width;
    }
    public get screenHeight() : number {

        return this.canvas.height;
    }

    public get anyPressed() : boolean {

        return this.anyKeyPressed; 
    }


    constructor(canvas : Canvas, globalVolume : number) {

        this.canvas = canvas;

        //
        // Input
        //
        this.keys = new Map<string, InputState> ();
        this.preventedKeys = new Array<string> ();
        this.actions = new Map<string, string[]> ();

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            if (this.preventedKeys.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Pressed);
        });

        window.addEventListener("keyup", (e : KeyboardEvent) => {

            if (this.preventedKeys.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Released);
        });

        window.addEventListener("mousedown", () => { window.focus(); });
        window.addEventListener("mousemove", () => { window.focus();});
        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());

        // Assets
        this.bitmaps = new Map<string, Bitmap> ();
        this.samples = new Map<string, Sample> ();

        // Audio
        this.globalVolume = globalVolume;
    }


    //
    // Input
    //


    private keyEvent(key : string, state : InputState) : void {

        if (this.keys.get(key) === state-2)
            return;

        this.keys.set(key, state);
        this.anyKeyPressed ||= Boolean(state & 1);
    }


    public update() : void {

        for (const k of this.keys.keys()) {

            const v : InputState = this.keys.get(k) ?? InputState.Up;
            if (v > 1) {
                
                this.keys.set(k, v-2);
            }
        }
        this.anyKeyPressed = false;
    }


    public addAction(name : string, keys : string[], prevent : boolean = true) : void {

        this.actions.set(name, Array.from(keys));
        if (prevent) {

            this.preventedKeys.push(...keys);
        }
    }


    public getAction(name : string) : InputState {

        const keys : string[] | undefined = this.actions.get(name) ?? [];
        for (const k of keys) {
            
            const state : InputState = this.keys.get(k) ?? InputState.Up;
            if (state != InputState.Up) {

                return state;
            }
        }
        return InputState.Up;
    }


    //
    // Assets
    //


    public addBitmap(name : string, bmp : Bitmap) : void {

        this.bitmaps.set(name, bmp);
    }


    public getBitmap(name : string) : Bitmap | undefined {

        return this.bitmaps.get(name);
    }


    public loadBitmap(name : string, path : string) : void {

        ++ this.assetCount;

        const img : HTMLImageElement = new Image();
        img.onload = (_ : Event) : void => {

            ++ this.loadCount;
            this.bitmaps.set(name, img);
        }
        img.src = path;
    }


    public loaded = () : boolean => this.loadCount >= this.assetCount;
    public loadedRatio = () : number => this.assetCount == 0 ? 1.0 : this.loadCount/this.assetCount;


    //
    // Audio player
    //

    public initialize() : void {

        this.ctx = new AudioContext();
    }


    public createSample(name : string,
        sequence : number[], 
        baseVolume : number = 1.0,
        type : OscillatorType = "square",
        ramp : Ramp = Ramp.Exponential,
        attackTime : number = 0.40) : void {

        this.samples.set(name, new Sample(this.ctx!, sequence, baseVolume, type, ramp, attackTime))
    }


    public playSample(name : string, volume : number = 0.60) : void {

        try {

            this.samples.get(name)?.play(volume*this.globalVolume);
        }
        catch (e) {}
    }
}
