


const rampFunctions : string[] = ["setValueAtTime", "linearRampToValueAtTime", "exponentialRampToValueAtTime"]; 


export const enum Ramp {

    Instant = 0,
    Linear = 1,
    Exponential = 2
};


export const getRampFunctionName = (ramp : Ramp) : string => rampFunctions[ramp] ?? rampFunctions[0];
