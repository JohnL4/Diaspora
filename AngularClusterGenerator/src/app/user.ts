/**
 * A user of this application.
 */
export class User {

   public get name(): string {return this._name }

   public get uid(): string { return this._uid }

   constructor (private _name: string, private _uid: string) {}
   
}
