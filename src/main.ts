import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { Game } from "./game/game.js";
import { generateAssets } from "./game/assetgenerator.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.assets.loadBitmap("_f", "f.png");
    event.assets.loadBitmap("_g", "g.png");
}


const onloadEvent = (event : ProgramEvent) : void => {

    event.input.addAction("l", ["ArrowLeft"]);
    event.input.addAction("r", ["ArrowRight"]);
    event.input.addAction("u", ["ArrowUp"]);
    event.input.addAction("d", ["ArrowDown"]);
    event.input.addAction("c", ["Space", "KeyZ", "Enter"]);
    event.input.addAction("p", ["Escape", "Enter"]);

    event.scenes.addScene("g", new Game(event), true);

    generateAssets(event.assets, event.audio);
}


const printError = (e : Error) : void => {

    console.log(e.stack);

    document.getElementById("d")?.remove();

    const textOut : HTMLElement = document.createElement("b");
    textOut.setAttribute("style", "color: rgb(224,73,73); font-size: 1.5em");
    textOut.innerText = "Fatal error:\n\n " + e.stack;

    document.body.appendChild(textOut);
}


function waitForInitialEvent() : Promise<AudioContext> {

    return new Promise<AudioContext> ( (resolve : (ctx : AudioContext | PromiseLike<AudioContext>) => void) : void => {

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            e.preventDefault();
            document.getElementById("i")?.remove();
    
            const ctx : AudioContext = new AudioContext();
            resolve(ctx);
    
        }, { once: true });
    } );
}


window.onload = () => (async () => {
    
    document.getElementById("it")!.innerText = "Press Any Key to Start";

    const ctx : AudioContext = await waitForInitialEvent();
    try {

        (new Program(256, 576, 192, 192, ctx, 0.60)).run(printError, initialEvent, onloadEvent);
    }
    catch (e : any) {

        printError(e);
    }
}) ();
