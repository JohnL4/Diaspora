export class Utils {
}

export function dice(numDice: number, numSides: number): number
{
   let t = 0;
   for (let i = 0; i < numDice; i++)
      t += Math.floor( Math.random() * numSides) + 1;
   return t;
}

/**
 * A fate dice throw; a value in the range [-4,4].
 */
export function fateThrow()
{
   return dice(4, 3) - 8;
}

let _alphaBravo: string[] =
   [
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
      "Echo",
      "Foxtrot",
      "Golf",
      "Hotel",
      "India",
      "Juliet",
      "Kilo",
      "Lima",
      "Mike",
      "November",
      "Oscar",
      "Papa",
      "Quebec",
      "Romeo",
      "Sierra",
      "Tango",
      "Uniform",
      "Victor",
      "Whiskey",
      "X-ray",
      "Yankee",
      "Zulu"
   ];

/**
 * Returns the phonetic alphabet word for i in range [1..26], else null.
 */
export function alphaBravo( i: number): string
{
   if (i < 1 || i > 26)
      return null;
   else
      return _alphaBravo[i-1];
}
