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

    // Bushes
    "246d00ff", // B Dark green

    // Mushroom leg
    "dbb649ff", // C Darker leg color
    "ffffdbff", // D Very bright yellow

    // Mushroom hat
    "b62400ff", // E Slightly orange-ish red
    "ff6d00ff", // F Orange
    "ffb600ff", // G Bright orange

    // Cat
    "ffdb00ff", // H Brownish thing
    "db9200ff", // I More yellowish brown

    // Misc. outline colors
    "244900ff", // J Darkest green
    "492400ff", // K Darkest brown

];


const GAME_ART_PALETTE_TABLE : string[] = [

    "J056", "J056", "K089", "K087", "KA78", "A0CD", "A0CD", "A0CD",
    "0007", "1034", "K089", "K087", "A0CD", "A0CD", "A0GF", "A0EF",
    "J0B5", "J0B5", "J0B5", "J0B5", "J0B5", "J0B5", "A0EF", "A0EF",
    "J0B5", "J0B5", "J0B5", "J0B5", "J0B5", "J0B5", "10H2", "00GD",
    "10IH", "10IH", "1034", "1034", "1034", "1024", "0000", "0000",
    "10IH", "10IH", "1034", "1034", "1034", "1034", "0000", "0000",
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



const generateBaseCloud = (colors : string[], yoffsets : number[], 
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


const generateClouds = (assets : Assets) : void => {

    assets.addBitmap("c",
        generateBaseCloud(["#4992db", "#92dbff", "#ffffff"], [0, 2, 4], 192, 96, 16, 24, 1.5)
    );
}


const generateBush = (assets : Assets, bmpGameArt : Bitmap) : void => {
    
    const canvas : Canvas = new Canvas(48, 64);

    canvas.drawBitmap(bmpGameArt, Flip.None, 0, 0, 0, 16, 48, 16);
    canvas.setColor("#246d00");
    canvas.fillRect(0, 16, 48, 48);

    assets.addBitmap("b", canvas.toBitmap());
}


const generateMushrooms = (assets : Assets, bmpGameArt : Bitmap) : void => {
    
    const canvas : Canvas = new Canvas(48, 96);

    // Base mushroom
    canvas.drawBitmap(bmpGameArt, Flip.None, 12, 16, 40, 0, 24, 8);
    for (let i = 0; i < 32; ++ i) {

        if (i < 10) {

            canvas.drawBitmap(bmpGameArt, Flip.None, 16, 24 + i*8, 32, 8, 16, 8);
        }
        if (i < 2) {

            canvas.drawBitmap(bmpGameArt, Flip.None, 40*i, 0, 48 + i*8, 8, 8, 16);
        }
        canvas.drawBitmap(bmpGameArt, Flip.None, 8 + i, 0, 55, 8, 1, 16);
    }

    // Dots
    for (let i = 0; i < 3; ++ i) {

        canvas.drawBitmap(bmpGameArt, Flip.None, 6 + 13*i, 4 + 4*(i % 2), 56, i == 2 ? 28 : 24, 8, 4);
    }

    assets.addBitmap("m", canvas.toBitmap());
}


const generateSun = (assets : Assets, bmpGameArt : Bitmap) : void => {

    const RADIUS : number = 32;
    const EYE_SHIFT_X : number = 4;
    const EYE_SHIFT_Y : number = 2;

    const canvas : Canvas = new Canvas(RADIUS*2, RADIUS*2);

    // "Body"
    canvas.setColor("#ffdb00");
    canvas.fillCircle(RADIUS, RADIUS, RADIUS);
    canvas.setColor("#ffff92");
    canvas.fillCircle(RADIUS - 2, RADIUS - 2, RADIUS - 2);

    // Eyes & mouth
    let mouthLineRadius : number = 12;
    for (let i = 0; i < 5; ++ i) {

        if (i < 2) {

            canvas.drawBitmap(bmpGameArt, Flip.None, 
                RADIUS - 10 + 12*i - EYE_SHIFT_X, 
                RADIUS - 4 - EYE_SHIFT_Y, 
                48, 24, 8, 8);
        }

        const dx : number = RADIUS - EYE_SHIFT_X - mouthLineRadius;
        const dy : number = RADIUS + 6 + i - EYE_SHIFT_Y

        canvas.setColor("#ffdb00");
        canvas.fillRect(dx, dy + 1, mouthLineRadius*2, 1);

        canvas.setColor("#000000");
        canvas.fillRect(dx, dy, mouthLineRadius*2, 1);

        mouthLineRadius -= (i + 1);
    }

    assets.addBitmap("s", canvas.toBitmap());
}


const generatePlayer = (assets : Assets, bmpGameArt : Bitmap) : void => {

    const canvas : Canvas = new Canvas(32, 24);

    canvas.setColor("#ffffff");
    canvas.fillRect(1, 14, 27, 6);

    canvas.drawBitmap(bmpGameArt, Flip.None, 0, 8, 16, 32, 32, 16);
    canvas.drawBitmap(bmpGameArt, Flip.None, 9, 0, 0, 32, 16, 16);

    assets.addBitmap("p", canvas.toBitmap());
}


const generateGasParticles = (assets : Assets) : void => {

    const canvas : Canvas = new Canvas(64, 16);

    for (let i = 0; i < 4; ++ i) {

        const cx : number = 8 + i*16;
        const radius : number = 5 - i;

        canvas.setColor("#b6b6b6");
        canvas.fillCircle(cx, 8, radius);

        canvas.setColor("#ffffff");
        canvas.fillCircle(cx - 1, 8 - 1, radius - 1);
    }

    assets.addBitmap("gp", canvas.toBitmap());
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
    generateBush(assets, bmpGameArt);
    generateMushrooms(assets, bmpGameArt);
    generateClouds(assets);
    generateSun(assets, bmpGameArt);
    generatePlayer(assets, bmpGameArt);
    generateGasParticles(assets);
    generateFonts(assets);

    // Audio
    generateSamples(assets, audio);
}
