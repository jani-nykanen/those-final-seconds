import { ProgramEvent } from "../core/event.js";
import { updateSpeedAxis } from "./gameobject.js";


export class Stats {
    
        
    public health : number = 3;

    public level : number = 0;
    public experienceCurrent : number = 0;
    public experienceTarget : number = 0;

    public time : number = 0;
    public timeFreeze : number = 5.0;
    public frameCount : number = 0;

    // public overheat : number = 0;

    public score : number = 0;
    public scoreTarget : number = 0;
    public scoreSpeed : number = 0;
    public bonus : number = 0;

    public readonly maxHealth : number = 3;
    public readonly maxTimeFreeze : number = 5.0;


    public update(event : ProgramEvent) : void {

        // Not gonna split these to smaller functions until I'm certain
        // I have enough spare bytes.

        // Time
        if (this.timeFreeze > 0) {

            this.timeFreeze = Math.max(0, this.timeFreeze - 1.0/60.0*event.tick);
        }
        else {

            this.time += this.frameCount == 0 ? 16 : 17;
            if (this.time >= 13*1000) {

                this.time = 13*1000;
                // TODO: GAME OVER!
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
                this.experienceTarget -= 1.0;
                this.experienceCurrent -= 1.0;
            }
        }

        

        // Score
        this.score = updateSpeedAxis(this.score, this.scoreTarget, this.scoreSpeed*event.tick);
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
}
