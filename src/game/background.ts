import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";


const LAYER_MODULO : number[] = [192, 48, 128, 192];
const LAYER_SPEED : number[] = [1, 0.5, 0.25, 0.67];


export class Background {


    private layerPositions : number[];


    constructor() {

        this.layerPositions = (new Array<number> (4)).fill(0.0);
    }


    private drawRepeatingBitmap(canvas : Canvas, bmp : Bitmap, xpos : number, ypos : number) : void {

        const w : number = bmp?.width ?? 0;
        const count : number = ((canvas.width/w) | 0) + 2;

        for (let i = 0; i < count; ++ i) {

            canvas.drawBitmap(bmp, Flip.None, i*w - (xpos % w), ypos);
        }
    }


    private drawGrass(canvas : Canvas, xpos : number, ypos : number) : void {

        const bmpGameArt : Bitmap = canvas.getBitmap("g");
        const count : number = ((canvas.width/16) | 0) + 2;

        for (let i = 0; i < count; ++ i) {

            canvas.drawBitmap(bmpGameArt, Flip.None, i*16 - (xpos % 16), ypos, 0, 0, 16, 8);
        }
    }


    private drawGround(canvas : Canvas) : void {

        const HEIGHT : number = 48;
        const LINE_DISTANCE : number = 24;

        const xpos : number = this.layerPositions[0];
        const ypos : number = canvas.height - HEIGHT;

        this.drawRepeatingBitmap(canvas, canvas.getBitmap("f"), xpos, ypos - 36);
        this.drawGrass(canvas, xpos, ypos - 3);
        
        // Green bottom
        canvas.setColor("#6db600");
        canvas.fillRect(0, ypos + 6, canvas.width, HEIGHT - 6);
        canvas.setColor("#dbff00");

        // Horizontal lines
        const vcount : number = ((canvas.width/LINE_DISTANCE) | 0) + 2;
        const shiftx : number = -(xpos % LINE_DISTANCE);
        for (let i = 0; i < vcount; ++ i) {

            // Create an impression of a 3D grid with minimal computations
            const topX : number = i*LINE_DISTANCE + shiftx;
            const bottomX : number = ((topX - canvas.width/2)/canvas.width)*(canvas.width*2) + canvas.width/2;

            canvas.drawPixelatedLine(topX, ypos, bottomX, canvas.height);
        }


        // Vertical lines
        let dy = ypos;
        for (let i = 0; i < 5; ++ i) {

            dy += (i + 1)*5.5;

            canvas.fillRect(0, dy, canvas.width, 1);
        }

        // Test
        // canvas.setColor("#ff0000");
        // canvas.fillRect(canvas.width - this.position - 16, ypos + HEIGHT/2 - 32, 32, 32);
    }

    
    public update(globalSpeed : number, event : ProgramEvent) : void {


        for (let k in this.layerPositions) {

            this.layerPositions[k] = (this.layerPositions[k] + LAYER_SPEED[k]*globalSpeed) % LAYER_MODULO[k];
        }
    }


    public draw(canvas : Canvas) : void {

        canvas.clear("#6db6ff");

        this.drawRepeatingBitmap(canvas, canvas.getBitmap("c"), this.layerPositions[3], 48);
        this.drawRepeatingBitmap(canvas, canvas.getBitmap("b"), this.layerPositions[1], 96);
        this.drawGround(canvas);
    }
}
