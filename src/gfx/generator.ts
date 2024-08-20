import { Bitmap } from "./bitmap.js";


const createEmptyCanvas = (width : number, height : number) : HTMLCanvasElement => {

    const canvas : HTMLCanvasElement = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    return canvas;
}


const unpackPalette = (palette : string[]) : number[][] => {

    const out : number[][] = new Array<number[]> ();
    for (let j = 0; j < palette.length; ++ j) {

        let entry : string = palette[j];
        if (entry.length <= 6) {

            entry += "ff";
        }

        const len : number = (palette[j].length/2) | 0;
        out.push(new Array<number> (len));
        for (let i = 0; i < len; ++ i) {

            out[j][i] = parseInt(palette[j].substring(i*2, i*2 + 2), 16);
        }
    }
    return out;
}   


const convertTile = (imageData : ImageData, 
    dx : number, dy : number, dw : number, dh : number, offset : number,
    colorTable : number[], palette : number[][]) : void => {

    for (let y = dy; y < dy + dh; ++ y) {

        for (let x = dx; x < dx + dw; ++ x) {

            const i : number = y * offset + x;
            // Image data is assumed to belong to a 2-bit (i.e 4-color) black-and-white 
            // picture, so  "(imageData.data[i*4]/85) | 0" find the... umm, saturation?... 
            // of the pixel, taking values from 0 (black) to 3 (white).
            const paletteEntry : number[] = palette[colorTable[(imageData.data[i*4]/85) | 0]] ?? [];

            for (let j = 0; j < 4; ++ j) {

                imageData.data[i*4 + j] = paletteEntry[j] ?? 255;
            }
        }
    }
}


export const applyPalette = (image : Bitmap,
    colorTables: (string | undefined) [], packedPalette : string[]) : Bitmap => {

    if (image === undefined) {

        return undefined;
    }

    const canvas : HTMLCanvasElement = createEmptyCanvas(image.width, image.height);

    const ctx : CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx === null) {

        return undefined;
    }
    ctx.drawImage(image, 0, 0);

    const imageData : ImageData = ctx.getImageData(0, 0, image.width, image.height);

    const w : number = (canvas.width/8) | 0;
    const h : number = (canvas.height/8) | 0;

    const palette : number[][] = unpackPalette(packedPalette);

    let j = 0;
    for (let y = 0; y < h; ++ y) {

        for (let x = 0; x < w; ++ x) {

            if (j >= colorTables.length)
                continue;

            const colorTable : number[] = (colorTables[j] ?? "0000").split("").map((s : string) => parseInt(s, 32));
            convertTile(imageData, 
                x*8, y*8, 8, 8, 
                image.width, colorTable, palette);
            ++ j;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas;
} 



export const createBitmapFromUint8Array = (array : Uint8Array, 
    width : number, height : number) : Bitmap => {

    const canvas : HTMLCanvasElement = createEmptyCanvas(width, height);
    const ctx : CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx === null) {

        return undefined;
    }

    const imageData : ImageData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < array.length; ++ i) {

        imageData.data[i] = array[i];
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas;
}


export const cropBitmap = (source : Bitmap, sx : number, sy : number, sw : number, sh : number) : Bitmap => {

    const canvas : HTMLCanvasElement = createEmptyCanvas(sw, sh);
    const ctx : CanvasRenderingContext2D = canvas.getContext("2d");

    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

    return canvas;
}
