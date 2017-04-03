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
    * The name of the cluster (mostly for saving and loading).
    */
   public name: string;

   /**
    * User guid of the last person to make an edit to this cluster.
    */
   public lastAuthor: string;

   /**
    * Date cluster last modified (including creation).
    */
   public lastChanged: Date;

   /**
    * Author-created notes.
    */
   public notes: string;
   
   /**
    * Map from system id to StarSystem.
    */
   public systemMap: Map<string,StarSystem>;

   /**
    * The slipstreams in the cluster.  No connection is expected to be represented more than once.
    */
   public slipstreams: Array<Slipstream>;

   /**
    * True iff the cluster's slipstreams are specified as connection to each star system's "high" or "low" slipknots.
    */
   public usesHighLowSlipstreams: boolean;
   
   public constructor( ) {}

   /**
    * The number of systems in this cluster. Setting this value will cause the cluster to be regenerated.
    */
   public get numSystems(): number { return this.systemMap == null ? 0 : this.systemMap.size }

   /**
    * Systems in cluster, sorted in id order. 
    */
   public get systems(): Array<StarSystem>
   {
      let sysv = new Array<StarSystem>();
      this.systemMap.forEach(function( v: StarSystem, k: string, m: Map<string,StarSystem>) { sysv.push( v); });
      sysv.sort( function( sa: StarSystem, sb: StarSystem)
                 {
                    if (sa.id < sb.id) return -1;
                    else if (sa.id > sb.id) return 1;
                    else return 0;
                 });
      return sysv;
   }

   /**
    * Clears existing map of systems and inserts the contents of the given array (keyed by id).
    */
   public set systems( aSystemv: Array<StarSystem>)
   {
      if (this.systemMap)
         this.systemMap.clear();
      else
         this.systemMap = new Map<string, StarSystem>();
      for (let sys of aSystemv)
      {
         this.systemMap.set(sys.id, sys);
      }
   }

//   /**
//    * Add a StarSystem to the cluster.  Use this instead of building a temporary array and setting it via "systems".
//    */
//   public addSystem( aSystem: StarSystem): void
//   {
//      this.systemMap.set( aSystem.id, aSystem);
//   }

   /**
    * Copy the data from the given cluster into this cluster, overwriting existing data.
    * I'm not yet sure how injection works, but I don't think I can just replace one Cluster reference with another.
    * Hence, this method.
    */
   public copyFrom( aCluster: Cluster): void
   {
      this.usesHighLowSlipstreams = aCluster.usesHighLowSlipstreams;
      this.systemMap = aCluster.systemMap;
      this.slipstreams = aCluster.slipstreams;
   }

   /**
    * Generate the starsystems and slipstreams that define the cluster.
    */
   generate( aNumSystems: number, aUseHighLowSlipstreams: boolean)
   {
      let me = this.constructor.name + ".generate(): ";
      this.usesHighLowSlipstreams = aUseHighLowSlipstreams;
      let sysv = new Array<StarSystem>(); // Temporary, rather than constantly rebuilding, sorted (by id), because IE 11 is stoopid.
      let slipstreamGuaranteeMet : boolean = false;
      
      this.systemMap = new Map<string,StarSystem>();
      
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
         this.systemMap.set(sys.id, sys);
         sysv.push( sys);
      }

      if (! slipstreamGuaranteeMet)
      {
         console.log( me + "Fulfilling slipstream guarantee.");
         let minAttrSum = (3 * 4) + 1;
         let maxAttrSum = (3 * -4) - 1;
         let minIx: number[]; // Indices of systems with lowest and highest attribute sums.
         let maxIx: number[];
         for (let i = 0; i < aNumSystems; i++)
         {
            let sum = sysv[i].tech + sysv[i].environment + sysv[i].resources;
            if (sum < minAttrSum)
            {
               minAttrSum = sum;
               minIx = new Array<number>();
               minIx.push( i);
            }
            else if (sum == minAttrSum)
               minIx.push( i);
            if (sum > maxAttrSum)
            {
               maxAttrSum = sum;
               maxIx = new Array<number>();
               maxIx.push( i);
            }
            else if (sum == maxAttrSum)
               maxIx.push( i);
         }
         let worstIx = minIx[ Math.floor(Math.random() * minIx.length)];
         let bestIx = maxIx[ Math.floor(Math.random() * maxIx.length)];
         console.log( me + `Worst systems: ${minIx} (picked ${worstIx}: ${sysv[worstIx].id}); Best systems: ${maxIx} (picked ${bestIx}: ${sysv[bestIx].id})`);
         this.systemMap.get(sysv[worstIx].id).tech = 2;
         this.systemMap.get(sysv[bestIx].id).tech = 2;
      }
      
      // Slipstreams
      this.slipstreams = new Array<Slipstream>();
      for (let i = 0; i < aNumSystems - 1; i++)
      {
         this.addNewSlipstream( sysv[i], sysv[i+1], this.usesHighLowSlipstreams);

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
         this.addNewSlipstream( aSysv[ aStartIx], aSysv[j], this.usesHighLowSlipstreams);
      }
   }

   /**
    * Add a new slipstream between the given starsystems, possibly with high and low slipknot positions, depending on
    * aUseHighLow.
    */
   private addNewSlipstream( aFrom: StarSystem, aTo: StarSystem, aUseHighLow: boolean): void
   {
      let leave, arrive: SlipknotPosition;
      
      if (aUseHighLow)
      {
         leave = (dice(1,2) == 1) ? SlipknotPosition.LOW : SlipknotPosition.HIGH;
         arrive = (dice(1,2) == 1) ? SlipknotPosition.LOW : SlipknotPosition.HIGH;
      }
      let ss = new Slipstream( aFrom, aTo, leave, arrive);
      this.slipstreams.push( ss);
      aFrom.slipstreams.push( ss);
      aTo.slipstreams.push( ss);
   }
}
