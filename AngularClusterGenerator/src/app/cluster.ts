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
   
   /**
    * Map from system id to StarSystem.
    */
   private _system: Map<string,StarSystem>;
   
   public constructor( ) {}

   /**
    * The number of systems in this cluster. Setting this value will cause the cluster to be regenerated.
    */
   public get numSystems(): number { return this._system == null ? 0 : this._system.size }

   /**
    * Systems in cluster, sorted in id order. 
    */
   public get systems(): Array<StarSystem>
   {
      let sysv = new Array<StarSystem>();
      this._system.forEach(function( v: StarSystem, k: string, m: Map<string,StarSystem>) { sysv.push( v); });
      sysv.sort( function( sa: StarSystem, sb: StarSystem)
                 {
                    if (sa.id < sb.id) return -1;
                    else if (sa.id > sb.id) return 1;
                    else return 0;
                 });
      return sysv;
   }

//   public set systems( aSystemsArray: Array<StarSystem>)
//   {
//      this._systems = aSystemsArray;
//   }
   
   generate( aNumSystems: number)
   {
      let sysv = new Array<StarSystem>(); // Temporary, rather than constantly rebuilding, sorted (by id), because IE 11 is stoopid.
      let slipstreamGuaranteeMet : boolean = false;
      
      this._system = new Map<string,StarSystem>();
      
      // Systems
      for (let i = 0; i < aNumSystems; i++)
      {
         let sys = new StarSystem(
            alphaBravo( i + 1), // Id
            alphaBravo( i + 1), // Name, same as id, initially.
            fateThrow(),        // Technology
            fateThrow(),        // Environment
            fateThrow());       // Resources
         if (sys.tech >= 2)
            slipstreamGuaranteeMet = true;
         this._system[sys.id] = sys;
         sysv.push( sys);
      }

      if (! slipstreamGuaranteeMet)
      {
         console.log( "Fulfilling slipstream guarantee.");
         let minAttrSum = (3 * 4) + 1;
         let maxAttrSum = (3 * -4) - 1;
         let minIx: number; // Indices of systems with lowest and highest attribute sums.
         let maxIx: number;
         for (let i = 0; i < aNumSystems; i++)
         {
            let sum = sysv[i].tech + sysv[i].environment + sysv[i].resources;
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
         this._system[sysv[minIx].id].tech = 2;
         this._system[sysv[maxIx].id].tech = 2;
      }
      
      // Slipstreams
      for (let i = 0; i < aNumSystems - 1; i++)
      {
         sysv[i].addNewDestination( sysv[i+1]); // Unconditional (equivalent to negative throw in rules).

         let t = fateThrow();
         if (t >= 0)
            this.connectToUnconnectedSystem( i, sysv);
         if (t > 0)
            this.connectToUnconnectedSystem( i, sysv);
      }
   }

   /**
    * Connect the system at aStartIx in aSysv to a higher-indexed system which is not yet connected.
    */
   private connectToUnconnectedSystem( aStartIx: number, aSysv: Array<StarSystem>)
   {
      // Find the next unconnected system
      let j = aStartIx + 1;
      for (; j < this.numSystems; j++)
      {
         let connections = aSysv[j].slipstreams;
         if (! connections || connections.length == 0)
            break;        // Found an unconnectd system.
      }
      if (j < this.numSystems)
      {
         // hook up
         aSysv[aStartIx].addNewDestination( aSysv[j]); // TODO: add high/low here, later.
      }
   }
}
