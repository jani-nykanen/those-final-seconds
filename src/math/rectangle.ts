import { Vector } from "./vector.js";


export class Rectangle {

    public x: number;
    public y: number;
    public w: number;
    public h: number;


    constructor(x : number = 0.0, y : number = 0.0, w : number = 0, h : number = 0) {

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }


    // IMPORTANT NOTE: the rectangles are assumed to be centered
    static overlay(r1 : Rectangle, r2 : Rectangle, 
        shift1 : Vector = new Vector(), shift2 : Vector = new Vector()) : boolean {

        return r1.x + r1.w/2 + shift1.x >= r2.x - r2.w/2 + shift2.x &&
               r1.x - r1.w/2 + shift1.x <= r2.x + r2.w/2 + shift2.x &&
               r1.y + r1.h/2 + shift1.y >= r2.y - r2.h/2 + shift2.y &&
               r1.y - r1.h/2 + shift1.y <= r2.y + r2.h/2 + shift2.y; 
    }


    public clone = () : Rectangle => new Rectangle(this.x, this.y, this.w, this.h);
}