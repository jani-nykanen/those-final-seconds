import { Ramp, Sample } from "./sample.js";


export class AudioPlayer {


    private ctx : AudioContext;

    private globalVolume : number;
    private enabled : boolean;

    public readonly getSample : (name : string) => Sample | undefined;


    constructor(ctx : AudioContext, 
        getSample : (name : string) => Sample | undefined,
        globalVolume : number = 0.60) {

        this.ctx = ctx;

        this.getSample = getSample;

        this.enabled = true;
        this.globalVolume = globalVolume;
    }


    public createSample = (sequence : number[], 
        baseVolume : number = 1.0,
        type : OscillatorType = "square",
        ramp : Ramp = Ramp.Exponential,
        attackTime : number = 0.50) : Sample => new Sample(this.ctx, sequence, baseVolume, type, ramp, attackTime);


    public playSample(_sample : Sample | string | undefined, volume : number = 1.0) : void {

        if (!this.enabled) {

            return;
        }

        const sample : Sample | undefined = typeof(_sample) === "string" ? this.getSample?.(_sample) : _sample;
        try {

            sample?.play(volume*this.globalVolume);
        }
        catch (e) {}
    }


    public toggle = (state : boolean = !this.enabled) : boolean => (this.enabled = state);


    public setGlobalVolume(vol : number) : void {

        this.globalVolume = vol;
    }


    public isEnabled = () : boolean => this.enabled;

}
