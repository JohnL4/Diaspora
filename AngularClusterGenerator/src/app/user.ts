/**
 * A user of this application.
 */
export class User {

   public get name(): string {return this._name }
   public set name( aName: string)
   {
      if (aName)
      {
         this._name = aName;
      }
      else
         throw new Error( "User name must be truthy");
   }

   public get uid(): string { return this._uid }

   constructor (private _uid: string, private _name: string, public email: string, public lastLogin: Date) {}

   public toString(): string
   {
      return `User[ uid = ${this._uid}; name = "${this._name}"; email = ${this.email}; lastLogin = ${this.lastLogin}]`;
   }   
}
