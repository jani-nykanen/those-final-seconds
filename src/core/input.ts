import { InputState } from "./inputstate.js";


//
// Merge to ProgramEvent to save bytes (see event.ts)
//

/*
export class Input {


    private keys : Map<string, InputState>;
    private preventedKeys : Array<string>;
    private actions : Map<string, string[]>;

    private anyKeyPressed : boolean = false;


    public get anyPressed() : boolean {

        return this.anyKeyPressed; 
    }


    constructor() {

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
    }


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

        const keys : string[] | undefined = this.actions.get(name);
        if (keys === undefined) {

            return InputState.Up;
        }

        for (const k of keys) {
            
            const state : InputState = this.keys.get(k) ?? InputState.Up;
            if (state != InputState.Up) {

                return state;
            }
        }
        return InputState.Up;
    }
}
*/