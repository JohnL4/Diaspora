import { Injectable } from '@angular/core';

import { StarSystem } from './star-system';
import { Slipstream } from './slipstream';
import { SlipknotPosition } from './slipknot-position';

import { dice, fateThrow, alphaBravo } from './utils';

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

   generate( aNumSystems: number)
   {
      let slipstreamGuaranteeMet : boolean = false;
      
      this._systems = new Array<StarSystem>( aNumSystems);
      
      // Systems
      for (let i = 0; i < this.numSystems; i++)
      {
         this._systems[i] = new StarSystem(
            alphaBravo( i + 1), // Name
            fateThrow(),        // Technology
            fateThrow(),        // Environment
            fateThrow());       // Resources
         if (this._systems[i].tech >= 2)
            slipstreamGuaranteeMet = true;
      }

      if (! slipstreamGuaranteeMet)
      {
         console.log( "Fulfilling slipstream guarantee.");
         let minAttrSum = (3 * 4) + 1;
         let maxAttrSum = (3 * -4) - 1;
         let minIx: number; // Indices of systems with lowest and highest attribute sums.
         let maxIx: number;
         for (let i = 0; i < this.numSystems; i++)
         {
            let s = this._systems[i];
            let sum = s.tech + s.environment + s.resources;
            if (sum < minAttrSum)
            {
               minAttrSum = sum;
               minIx = i;
            }
            if (sum > maxAttrSum)
            {
               maxAttrSum = sum;
               maxIx = i;
            }
         }
         this._systems[minIx].tech = 2;
         this._systems[maxIx].tech = 2;
      }
      
      // Slipstreams
      for (let i = 0; i < this.numSystems - 1; i++)
      {
         this._systems[i].addNewDestination( this._systems[i+1]); // Unconditional (equivalent to negative throw in rules).

         let t = fateThrow();
         if (t >= 0)
            this.connectToUnconnectedSystem( i);
         if (t > 0)
            this.connectToUnconnectedSystem( i);
      }
   }

   /**
    * Connect the system at aStartIx to a higher-indexed system which is not yet connected.
    */
   private connectToUnconnectedSystem( aStartIx: number)
   {
      // Find the next unconnected system
      let j = aStartIx + 1;
      for (; j < this.numSystems; j++)
      {
         let connections = this._systems[j].slipstreams;
         if (! connections || connections.length == 0)
            break;        // Found an unconnectd system.
      }
      if (j < this.numSystems)
      {
         // hook up
         this._systems[aStartIx].addNewDestination( this._systems[j]); // TODO: add high/low here, later.
      }
   }
}
