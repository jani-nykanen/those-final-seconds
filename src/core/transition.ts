import { Canvas } from "../gfx/canvas.js";
import { ProgramEvent } from "./event.js";
import { Vector } from "../math/vector.js";


//
// Unused since this took way too many bytes
//


export const enum TransitionType {
    None = 0,
    // Fade = 1,
    Circle = 2,
};


export class Transition {


    private timer : number = 1.0;
    private fadeOut : boolean = false;
    private effectType : TransitionType = TransitionType.None;
    private active : boolean = false;
    private speed : number = 1.0;
    private color : string = "";
    private center : Vector | undefined = undefined;

    private callback : ((event : ProgramEvent) => void) | undefined = undefined;


    constructor() {}


    public activate(fadeOut : boolean, type : TransitionType, speed : number,
        callback : ((event : ProgramEvent) => any) | undefined = undefined, 
        color : string = "#000000", center : Vector | undefined = undefined) : void {

        this.fadeOut = fadeOut;
        this.speed = speed;
        this.timer = 1.0;
        this.callback = callback;
        this.effectType = type;
        this.color = color;
        this.center = center;

        this.active = true;
    }


    public update(event : ProgramEvent) : void {

        if (!this.active) {

            return;
        }

        this.timer -= this.speed*event.tick;
        if (this.timer <= 0) {

            this.fadeOut = !this.fadeOut;
            if (!this.fadeOut) {

                this.timer += 1.0;
                this.callback?.(event);
                return;
            }

            this.active = false;
            this.timer = 0;
        }
    }


    public draw(canvas : Canvas) : void {

        if (!this.active || this.effectType == TransitionType.None)
            return;

        canvas.moveTo();

        const t : number = this.fadeOut ? (1.0 - this.timer) : this.timer;

        switch (this.effectType) {
/*
        case TransitionType.Fade:

            canvas.setColor(this.color);
            canvas.setAlpha(t);
            canvas.fillRect(0, 0, canvas.width, canvas.height);
            canvas.setAlpha();
            break;
*/
        case TransitionType.Circle: {

            const center : Vector = this.center ?? new Vector(canvas.width/2, canvas.height/2);

            const maxRadius : number = Math.max(
                Math.hypot(center.x, center.y),
                Math.hypot(canvas.width - center.x, center.y),
                Math.hypot(canvas.width - center.x, canvas.height - center.y),
                Math.hypot(center.x, canvas.height - center.y)
            );

            const radius : number = (1 - t)*(1 - t)*maxRadius;

            canvas.setColor(this.color);
            canvas.fillCircleOutside(radius, center.x, center.y);
            break;
        }

        default:
            break;
        }
    }


    public isActive = () : boolean => this.active;
    public isFadingOut = () : boolean => this.active && this.fadeOut;

    
    public deactivate() : void {

        this.active = false;
    }


    public setCenter(pos : Vector) : void {

        this.center = pos;
    }


    public changeSpeed(newSpeed : number) : void {

        this.speed = newSpeed;
    }
}
