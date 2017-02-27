import { StarSystem } from './star-system';
import { SlipknotPosition } from './slipknot-position';

export class Slipstream
{
   public constructor( private _from: StarSystem,
                       private _to: StarSystem,
                       private _leave?: SlipknotPosition,
                       private _arrive?: SlipknotPosition)
   {
      if ((! this._leave && this._arrive)
          || (this._leave && ! this._arrive))
      {
         throw "Leave & arrive must be both null or both non-null";
      }
   }

   public get from() { return this._from }
   public get to() { return this._to }
   public get leave() { return this._leave }
   public get arrive() { return this._arrive }

   /**
    * Returns the endpoint of the slipstream that is not the given system.
    */
   public otherEndPoint( aSystem: StarSystem): StarSystem
   {
      if (this._to == aSystem)
         return this._from;
      else
         return this._to;
   }
}
