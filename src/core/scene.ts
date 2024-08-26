import { ProgramEvent } from "./event.js";
import { Canvas } from "../gfx/canvas.js";


export interface Scene {

    // onChange?(param : SceneParameter, event : ProgramEvent) : void;
    update(event : ProgramEvent) : void;
    redraw(canvas : Canvas) : void;
    // dispose?() : SceneParameter;
}
