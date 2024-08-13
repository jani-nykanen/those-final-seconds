import { Assets } from "../core/assets.js";
import { applyPalette, cropBitmap } from "../gfx/generator.js";
import { Bitmap } from "../gfx/bitmap.js";
import { Canvas } from "../gfx/canvas.js";
import { Flip } from "../gfx/flip.js";
import { AudioPlayer } from "../audio/audioplayer.js";


const PALETTE_LOOKUP : string[] = [

    "00000000", // 0 Transparent

    // Black, white and shades of gray
    "000000ff", // 1 Black
    "ffffffff", // 2 White
    "6d6d6dff", // 3 Dark gray
    "b6b6b6ff", // 4 Bright gray,

    // Grass
    "6db600ff", // 5 Darker green
    "dbff00ff", // 6 Lighter green

    // Fence
    "924900ff", // 7 Darker brown
    "b66d00ff", // 8 Brown
    "ffb66dff", // 9 Beige?
    "6d2400ff", // A Darkest reddish brownish thing
];


const GAME_ART_PALETTE_TABLE : string[] = [

    "1056", "1056", "1089", "1087", "1A78", "0000", "0000", "0000",
    "0007", "1034", "1089", "1087", "0000", "0000", "0000", "0000",
];


const generateGameArt = (assets : Assets) : Bitmap => {

    const bmpGameArtRaw : Bitmap = assets.getBitmap("_g");
    const bmpGameArt : Bitmap = applyPalette(bmpGameArtRaw,
        GAME_ART_PALETTE_TABLE, PALETTE_LOOKUP);

    assets.addBitmap("g", bmpGameArt);

    return bmpGameArt;
}


const generateFence = (assets : Assets, bmpGameArt : Bitmap) : void => {

    const canvas : Canvas = new Canvas(32, 48);

    // Horizontal bar
    for (let i = 0; i < 6; ++ i) {

        canvas.drawBitmap(bmpGameArt, Flip.None, i*6, 10, 33, 0, 6, 8);
    }
    canvas.drawBitmap(bmpGameArt, Flip.None, 22, 10, 32, 0, 7, 8);
    canvas.drawBitmap(bmpGameArt, Flip.None, 3, 10, 33, 0, 7, 8);

    // Vertical bar
    for (let i = 0; i < 3; ++ i) {

        if (i < 2) {

            canvas.drawBitmap(bmpGameArt, Flip.None, (i + 1)*8, 0, 16 + i*8, 0, 8, 16);
        }
        canvas.drawBitmap(bmpGameArt, Flip.None, 8, 16 + i*7, 16, 9, 8, 7);
        canvas.drawBitmap(bmpGameArt, Flip.None, 16, 16 + i*7, 24, 9, 8, 7);
    }

    // Nail
    for (let i = 0; i < 2; ++ i) {

        canvas.drawBitmap(bmpGameArt, Flip.None, 12, 10, i*8, 8, 8, 8);
    }

    assets.addBitmap("f", canvas.toBitmap());
}



const generateClouds = (colors : string[], yoffsets : number[], 
    width : number, height : number, 
    amplitude : number, period : number, sineFactor : number) : Bitmap => {

    const canvas : Canvas = new Canvas(width, height);

    for (let y = 0; y < yoffsets.length; ++ y) {

        const yoff : number = yoffsets[y];

        canvas.setColor(colors[y]);
        for (let x = 0; x < width; ++ x) {

            const t : number = ((x % period) - period/2)/(period/2 + 2);
            const s : number = x/width*Math.PI*2;
            const dy = 1 + (1.0 - Math.sqrt(1.0 - t*t) + (1.0 + Math.sin(s))*sineFactor)*amplitude + yoff;

            canvas.fillRect(x, dy, 1, height - dy + 1);
        }
    }

    return canvas.toBitmap();
}


const generateBush = (assets : Assets) : void => {

    const bmpBush : Bitmap = generateClouds(
        ["#000000", "#92b600", "#246d00"],
        [0, 1, 3], 192, 80, 16, 24, 1.0
    );

    assets.addBitmap("b", bmpBush);
}


const generateFonts = (assets : Assets) : void => {

    const bmpFontRaw : Bitmap = assets.getBitmap("_f");

    const fontBlack : Bitmap = applyPalette(bmpFontRaw, 
        (new Array<string>(16*4)).fill("0001"), 
        PALETTE_LOOKUP);
    const fontWhite : Bitmap = applyPalette(bmpFontRaw, 
        (new Array<string>(16*4)).fill("0002"), 
        PALETTE_LOOKUP);

    // Generate a font with black outlines
    const canvas : Canvas = new Canvas(256, 64);
    for (let y = 0; y < 4; ++ y) {

        for (let x = 0; x < 16; ++ x) {

            const dx : number = x*16 + 4;
            const dy : number = y*16 + 6

            // Outlines
            for (let i = -1; i <= 1; ++ i) {

                for (let j = -1; j <= 1; ++ j) {

                    // if (i == j) continue;
                    canvas.drawBitmap(fontBlack, Flip.None, dx + i, dy + j, x*8, y*8, 8, 8);
                }
            }

            // Base characters
            canvas.drawBitmap(fontWhite, Flip.None, dx, dy, x*8, y*8, 8, 8);
        }
    }

    assets.addBitmap("fw", fontWhite);
    assets.addBitmap("fo", canvas.toBitmap());
}



const generateSamples = (assets : Assets, audio : AudioPlayer) : void => {

    // ...
}


// Hmm, generating assets from assets...
export const generateAssets = (assets : Assets, audio : AudioPlayer) : void => {

    // Bitmaps
    const bmpGameArt : Bitmap = generateGameArt(assets);
    generateFence(assets, bmpGameArt);
    generateBush(assets);
    generateFonts(assets);

    // Audio
    generateSamples(assets, audio);
}
