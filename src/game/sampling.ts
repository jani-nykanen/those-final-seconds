


export const sampleDiscreteDistribution = (weights : number[]) : number => sampleDiscreteDistributionInterpolate(weights, weights, 1.0);


export const sampleDiscreteDistributionInterpolate = (weights1 : number[], weights2 : number[], t : number) : number => {

    const p : number = Math.random();
    let v1 : number = weights1[0];
    let v2 : number = weights2[0];

    const len : number = Math.min(weights1.length, weights2.length);

    let v : number = (1.0 - t)*v1 + t*v2;

    let i : number = 0;
    for (i = 0; i < len; ++ i) {

        if (p < v)  
            break;
        
        if (i < len-1) {

            v1 = weights1[i+1];
            v2 = weights2[i+1];
            v += (1.0 - t)*v1 + t*v2;
        }
    }

    return i;
}
