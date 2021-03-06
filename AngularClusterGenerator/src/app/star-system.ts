import { Slipstream } from './slipstream';
import { SlipknotPosition } from './slipknot-position';

/**
 * A single star system, with stats Tn Em Rp, where n, m, p are each in range [-4..4].
 */
export class StarSystem {

   /**
    * The slipstreams at this system.
    */
   public slipstreams: Array<Slipstream> = new Array<Slipstream>();
   
   /**
    * System aspects (two on its own merits and one from the cluster slipstream configuration.
    */
   public aspects: Array<string> = new Array<string>(3);

   public notes: string;

   public isBeingEdited: boolean;
   
   public constructor( private _id: string,
                       public name: string,
                       public tech: number,
                       public environment: number,
                       public resources: number)
   {};

   public get id() { return this._id; }

   public toggleEdit():void
   {
      this.isBeingEdited = ! this.isBeingEdited;
   }
   
//   /**
//    * Adds a new slipstream between this system and aTo system.
//    */
//   public addNewDestination( aTo: StarSystem, aLeave?: SlipknotPosition, anArrive?: SlipknotPosition)
//   {
//      let ss = new Slipstream( this, aTo, aLeave, anArrive);
//      this.slipstreams.push( ss);
//      aTo.slipstreams.push( ss);
//   }
}
