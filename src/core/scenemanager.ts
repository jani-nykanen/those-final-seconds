import { ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";


/*
export class SceneManager {

    
    private scenes : Map<string, Scene>;
    // Funny naming since we cannot make this readonly
    private activeSceneRef : Scene | undefined = undefined;


    public get activeScene() : Scene | undefined {

        return this.activeSceneRef;
    }


    constructor() {

        this.scenes = new Map<string, Scene> ();
    }


    public addScene(name : string, scene : Scene, makeActive : boolean = true) : void {

        // One should check if a scene with the same name already exists, but
        // we need to save space, so...
        this.scenes[name] = scene;
        if (this.activeSceneRef === undefined || makeActive) {

            this.activeSceneRef = scene;
        }
    }


    public changeScene(newScene : string, event : ProgramEvent) : void {

        const scene : Scene | undefined = this.scenes[newScene];
        if (scene === undefined) {

            return;
        }
        

        scene?.onChange(this.activeSceneRef?.dispose?.(), event);
        this.activeSceneRef = scene;
    }
}
*/