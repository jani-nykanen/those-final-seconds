import { ProgramEvent } from "../core/event.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";


export interface Spawnable extends GameObject {

    playerCollision?(player : Player, event : ProgramEvent) : void
}
