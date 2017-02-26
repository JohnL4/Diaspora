import { Injectable } from '@angular/core';

import { StarSystem } from './star-system';

import { dice, alphaBravo } from './utils';

/**
 * A cluster of star systems.
 */
@Injectable()
export class Cluster {
   
   private _systems: StarSystem[];
   
   /**
    * The number of systems in this cluster. Setting this value will cause the cluster to be regenerated.
    */
   public get numSystems(): number { return this._systems == null ? 0 : this._systems.length }

   /**
    * Systems in cluster. Returns reference to 'systems' array. Do not modify the array itself, please, but feel free to
    * modify the individual systems.
    */
   public get systems()
   {
      return this._systems;
   }

   public set systems( aSystemsArray: Array<StarSystem>)
   {
      this._systems = aSystemsArray;
   }
   
   public constructor( ) {}

   generateSystems( aNumSystems: number)
   {
      this._systems = new Array<StarSystem>( aNumSystems);
      for (let i = 0; i < this.numSystems; i++)
         this._systems[i] = new StarSystem(
            alphaBravo( i + 1), // Name
            dice(4, 3) - 8,     // Tech (4d3 - 8 should give range [-4,4])
            dice(4, 3) - 8,     // Environment
            dice(4, 3) - 8);    // Resources
   }
}
