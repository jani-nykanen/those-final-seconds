import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";


const LAYER_MODULO : number[] = [192, 48, 192, 192];
const LAYER_SPEED : number[] = [1, 0.5, 0.25, 0.33];


const GROUND_HEIGHT : number = 48;
// Yes it's a constant now
export const GROUND_LEVEL : number = GROUND_HEIGHT/2;


export class Background {


    private layerPositions : number[];


    constructor() {

        this.layerPositions = (new Array<number> (4)).fill(0.0);
    }


    private drawRepeatingBitmap(canvas : Canvas, bmp : Bitmap, xpos : number, ypos : number) : void {

        const w : number = bmp.width;
        const count : number = ((canvas.width/w) | 0) + 2;

        for (let i = 0; i < count; ++ i) {

            canvas.drawBitmap(bmp, Flip.None, i*w - (xpos % w), ypos);
        }
    }


    private drawMushrooms(canvas : Canvas, bmp : Bitmap, xpos : number, ypos : number) : void {

        const YOFF : number = 24;
        const XOFF : number = 96;

        const count : number = ((canvas.width/(XOFF*2)) | 0) + 2;

        for (let j = 0; j < count; ++ j) {

            const dx : number = -xpos + j*(XOFF*2);
            if (dx >= canvas.width) {

                break;
            }

            for (let i = 0; i < 2; ++ i) {

                canvas.drawBitmap(bmp, Flip.None, dx + XOFF*i, ypos + YOFF*i);
            }
        }
    }


    private drawGrass(canvas : Canvas, xpos : number, ypos : number) : void {

        const count : number = ((canvas.width/16) | 0) + 2;

        for (let i = 0; i < count; ++ i) {

            canvas.drawBitmap("g", Flip.None, i*16 - (xpos % 16), ypos, 0, 0, 16, 8);
        }
    }


    public drawGround(canvas : Canvas, drawGround : boolean = true) : void {

        const LINE_DISTANCE : number = 24;

        const xpos : number = this.layerPositions[0];
        const ypos : number = canvas.height - GROUND_HEIGHT;
        
        // Green bottom
        if (drawGround) {

            canvas.fillRect(0, ypos + 4, canvas.width, GROUND_HEIGHT - 4, "#6db600");
        }
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


    public drawBackground(canvas : Canvas, camPos : number) : void {

        const xpos : number = this.layerPositions[0];
        const ypos : number = canvas.height - GROUND_HEIGHT;

        canvas.clear("#6db6ff");

        // Sun
        canvas.drawBitmap("s", Flip.None, canvas.width - 96, 16);

        this.drawRepeatingBitmap(canvas, canvas.getBitmap("c")!, this.layerPositions[3], 48 - camPos/4);
        this.drawMushrooms(canvas, canvas.getBitmap("m")!, this.layerPositions[2], 44 - camPos/2);
        this.drawRepeatingBitmap(canvas, canvas.getBitmap("b")!, this.layerPositions[1], 96 - camPos/1.5);

        this.drawRepeatingBitmap(canvas, canvas.getBitmap("f")!, xpos, ypos - 36 - camPos);
        this.drawGrass(canvas, xpos, ypos - 3 - camPos);
    }
}
