import { StarSystem } from './star-system';

/**
 * A cluster of star systems.
 */
export class Cluster {
   public systems: StarSystem[];

   public constructor( public numSystems: number) {}

   public generateSystems()
   {
      for (let i = 0; i < this.numSystems; i++)
         this.systems[i] = new StarSystem("A", 1, -1, 1);
   }
}
