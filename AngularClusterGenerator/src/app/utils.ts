import { Cluster } from './cluster';
import { User } from './user';

export const ASCII_US = "\x1F";

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

/**
 * Makes a universally unique cluster name by combining the cluster name with date from the User.  Note that neither
 * cluster nor user need to exist (both can be null) or have truthy data, but if they don't the cluster name will not
 * truly be unique.  Returned value is unencoded/unescaped.
 */
export function uniqueClusterName( aCluster: Cluster, aUser: User): string
{
   let uid = aUser ? aUser.uid : "";
   if (! uid)
      uid = "";
   let retval = uniqueClusterNameFromUid( aCluster, uid);
   return retval;
}

/**
 * Makes a universally unique cluster name by combining the cluster name with the user uid.  Note that neither cluster
 * nor user need to exist (both can be null) or have truthy data, but if they don't the cluster name will not truly be
 * unique.
 */
export function uniqueClusterNameFromUid( aCluster: Cluster, aUserUid: string): string
{
   let me = "utils.uniqueClusterNameFromUid(): ";
   // We stringify the cluster name in case somebody is doing something shady like inject another ASCII US into it.
   let stringifiedClusterName: string;
   if (aCluster ? aCluster.name : "")
      stringifiedClusterName = JSON.stringify( aCluster.name);
   else
      stringifiedClusterName = "";

   console.log( me + `stringified cluster name: "${stringifiedClusterName}"`);
   let retval = stringifiedClusterName + ASCII_US + aUserUid; 
   return retval;

}
