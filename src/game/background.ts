import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/canvas.js";


export class Background {


    private position : number = 0;


    constructor() {

        // ...
    }


    private drawGround(canvas : Canvas, ypos : number) : void {

        const LINE_DISTANCE : number = 21.33333;
        
        if (ypos >= canvas.height) {

            return;
        }

        canvas.setColor("#92db00");
        canvas.fillRect(0, ypos, canvas.width, canvas.height - ypos);
        canvas.setColor("#246d00");

        // Horizontal lines
        const vcount : number = ((canvas.width/LINE_DISTANCE) | 0) + 2;
        const shiftx : number = -((this.position/3*2) % LINE_DISTANCE);
        for (let i = 0; i < vcount; ++ i) {

            // Create an impression of a 3D grid with minimal computations
            const topX : number = i*LINE_DISTANCE + shiftx;
            const bottomX : number = ((topX - canvas.width/2)/canvas.width)*(canvas.width*2) + canvas.width/2;

            canvas.drawPixelatedLine(topX, ypos, bottomX, canvas.height);
        }


        // Vertical lines
        const hcount : number = 5; // A magic number of out of nowhere
        for (let i = 0; i < hcount; ++ i) {

            
        }

        // Test
        // canvas.setColor("#ff0000");
        // canvas.fillRect(canvas.width - this.position - 16, ypos + (canvas.height - ypos)/2 - 32, 32, 32);
    }

    
    public update(globalSpeed : number, event : ProgramEvent) : void {

        const POSITION_MODULO : number = 256;

        this.position = (this.position + globalSpeed) % POSITION_MODULO;
    }


    public draw(canvas : Canvas) : void {

        const GROUND_BASE_HEIGHT = 64;

        this.drawGround(canvas, canvas.height - GROUND_BASE_HEIGHT);
    }
}
