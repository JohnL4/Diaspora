/**
 * A single star system, with stats Tn Em Rp, where n, m, p are each in range [-4..4].
 */
export class StarSystem {
   public neighbors: StarSystem[];

   public constructor( public name: string, public tech: number, public environment: number, public resources: number) {};
}
