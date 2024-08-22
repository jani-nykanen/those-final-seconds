import { ProgramEvent } from "../core/event.js";
import { updateSpeedAxis } from "./gameobject.js";


const LEVEL_UP_FLICKER_TIME : number = 30;
const LOSE_BONUS_FLICKER_TIME : number = 30;


export class Stats {
    
    //
    // These are all public to save bytes. Not gonna
    // add a horde of getters/setters (unless they do
    // more than one thing).
    //
        
    public health : number = 3;

    public level : number = 0;
    public experienceCurrent : number = 0;
    public experienceTarget : number = 0;
    public levelupFlicker : number = 0;
    public bonusFlicker : number = 0;

    public panicLevel : number = 0;

    public time : number = 13*1000;
    public timeFreeze : number = 0;
    public frameCount : number = 0;

    // public overheat : number = 0;

    public score : number = 0;
    public scoreTarget : number = 0;
    public scoreSpeed : number = 0;
    public bonus : number = 0;

    public readonly maxHealth : number = 3;
    public readonly maxTimeFreeze : number = 5.0;


    public update(updateTime : boolean, event : ProgramEvent) : void {

        // Not gonna split these to smaller functions until I'm certain
        // I have enough spare bytes.

        // Time
        if (updateTime) {

            if (this.timeFreeze > 0) {

                this.timeFreeze = Math.max(0, this.timeFreeze - 1.0/60.0*event.tick);
            }
            else {

                this.time -= this.frameCount == 0 ? 16 : 17;
                if (this.time <= 0) {

                    this.time = 0;
                    // TODO: GAME OVER!
                }
            }
        }
        this.frameCount = (this.frameCount + 1) % 3;
        
        // Experience
        if (this.level == 4) {

            this.experienceCurrent = 0.0;
            this.experienceTarget = 0.0;
        }
        else {

            this.experienceCurrent = updateSpeedAxis(this.experienceCurrent, this.experienceTarget, 1.0/60.0*event.tick);
            if (this.experienceCurrent >= 1.0 && 
                this.experienceTarget >= 1.0) {

                ++ this.level;
                this.levelupFlicker = LEVEL_UP_FLICKER_TIME;
                this.experienceTarget -= 1.0;
                this.experienceCurrent -= 1.0;

                event.playSample("l");
            }
        }
        this.levelupFlicker = Math.max(0, this.levelupFlicker - event.tick);
        this.bonusFlicker = Math.max(0, this.bonusFlicker - event.tick);

        // Score
        this.score = updateSpeedAxis(this.score, this.scoreTarget, this.scoreSpeed*event.tick);

        this.panicLevel = Math.min(2, ((13*1000 - this.time)/(1000*5)) | 0);
    }


    public addTimeFreeze(seconds : number) : void {

        this.timeFreeze = Math.min(this.maxTimeFreeze, this.timeFreeze + seconds);
    }


    public addHealth(amount : number) : void {

        this.health = Math.min(this.maxHealth, this.health + amount);
    }


    public addPoints(count : number) : void {
        
        this.scoreTarget += (count*(1.0 + this.bonus)) | 0;
        this.scoreSpeed = ((this.scoreTarget - this.score)/10) | 0;
    }


    public loseLevel() : void {

        if (this.level == 0) {

            this.experienceTarget = 0;
        }
        this.level = Math.max(0, this.level - 1);
        this.levelupFlicker = LEVEL_UP_FLICKER_TIME;

        if (this.bonus > 0.0) {

            this.bonus = 0.0;
            this.bonusFlicker = LOSE_BONUS_FLICKER_TIME;
        }
    }
}
