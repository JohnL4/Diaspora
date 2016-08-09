export class Utils {
}

export function dice(numDice: number, numSides: number): number
{
   let t = 0;
   for (let i = 0; i < numDice; i++)
      t += Math.floor( Math.random() * numSides) + 1;
   return t;
}
