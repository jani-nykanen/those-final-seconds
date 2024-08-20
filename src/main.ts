import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { Game } from "./game/game.js";
import { generateAssets } from "./game/assetgenerator.js";
import { Canvas } from "./gfx/canvas.js";
import { Align } from "./gfx/align.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.assets.loadBitmap("_f", "f.png");
    event.assets.loadBitmap("_g", "g.png");
}


const initialScreen = (canvas : Canvas) : void => {

    canvas.clear("#000000");
    canvas.drawText("_f", "PRESS ANY KEY", canvas.width/2, canvas.height/2 - 4, -1, 0, Align.Center);
}


const onloadEvent = (event : ProgramEvent) : void => {

    event.input.addAction("l", ["ArrowLeft", "KeyA"]);
    event.input.addAction("r", ["ArrowRight", "KeyD"]);
    event.input.addAction("u", ["ArrowUp", "KeyW"]);
    event.input.addAction("d", ["ArrowDown", "KeyS"]);
    event.input.addAction("s", ["Space", "KeyZ", "ControlLeft"]);
    event.input.addAction("c", ["Space", "KeyZ", "Enter"]);
    event.input.addAction("p", ["Escape", "Enter"]);

    generateAssets(event.assets, event.audio);
}


window.onload = () : void => (new Program(256, 576, 192, 192, 0.60)).run(Game, initialEvent, initialScreen, onloadEvent);

