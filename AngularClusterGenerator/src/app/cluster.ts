import { Injectable } from '@angular/core';

import { StarSystem } from './star-system';

/**
 * A cluster of star systems.
 */
@Injectable()
export class Cluster {
   private _numSystems: number;
   
   private _systems: StarSystem[];
   
   /**
    * The number of systems in this cluster. Setting this value will cause the cluster to be regenerated.
    */
   public get numSystems(): number { return this._numSystems; }
   public set numSystems( aNumSystems: number)
   {
      this._numSystems = aNumSystems;
      this._systems = null;
   }

   /**
    * Systems in cluster. Returns reference to 'systems' array. Do not modify the array itself, please, but feel free to
    * modify the individual systems.
    */
   public get systems()
   {
      if (this._systems == null || this._systems.length != this._numSystems)
         this.generateSystems();
      return this._systems;
   }
   
   public constructor( /* aNumSystems: number */ ) {}

   // TODO: make public and hook up to "Ok" button on Params tab?  And only then transfer data from input field to
   // model?
   private generateSystems()
   {
      for (let i = 0; i < this.numSystems; i++)
         this._systems[i] = new StarSystem("A", 1, -1, 1);
   }
}
