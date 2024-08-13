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
];


const GAME_ART_PALETTE_TABLE : string[] = [

    "0000", "0000",
    "0000", "0000", 
];


const generateGameArt = (assets : Assets) : void => {

    const bmpGameArtRaw : Bitmap = assets.getBitmap("_g");
    const bmpGameArt : Bitmap = applyPalette(bmpGameArtRaw,
        GAME_ART_PALETTE_TABLE, PALETTE_LOOKUP);

    assets.addBitmap("g", bmpGameArt);
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
    generateGameArt(assets);
    generateFonts(assets);

    // Audio
    generateSamples(assets, audio);
}
