import { Injectable } from '@angular/core';

import { Cluster } from './cluster';

// I'm thinking this thing stores serialized XML somewhere and retrieves it from somewhere.
//
// Maybe into a global variable (how do we set that up) and via a text field somewhere (how do we set that up)?  In
// future, a FireBase d/b, maybe?  Need to get credentials from user for FireBase.

@Injectable()
export class ClusterPersistenceService
{
   private _firebase: any;
   private _ui: any;            // Firebase ui
   private _db: any;            // Firebase d/b
   private _authProvider: any;  // Firebase Google auth provider
   private _googleAccessToken: any;
   private _user: any;
   
   private _me = "cluster-persistence.service.ts";
   private _initialized: boolean = false;
   
   private _clusterNames: string[];
   
   constructor()
   {
      console.log( `${this._me}: ctor`);
   }

   public init(): void
   {
      if (this._initialized)    // Probably not threadsafe, but I'll think about that tomorrow.  After all, tomorrow is another day.
         return;
      let me = `${this._me}: init()`;
      console.log( `${this._me}: init(): this = ${this}`);
      this._firebase = require( "firebase");
      let config = {
         apiKey: "AIzaSyBiNVpydoOUGJiIavCB3f8qvB6ARYSy_1E",
         authDomain: "diaspora-21544.firebaseapp.com",
         databaseURL: "https://diaspora-21544.firebaseio.com",
         storageBucket: "diaspora-21544.appspot.com",
         messagingSenderId: "222484722746"
      };
      this._firebase.initializeApp( config);
      // this.doLogin();
      this._db = this._firebase.database();
      console.log( `${this._me}: initialized firebase, db = "${this._db}"`);
      // Re: .bind(this): See http://stackoverflow.com/a/20279485/370611
      this._db.ref( 'clusterNames').on( 'value',
                                        this.clusterNamesValueChanged.bind( this),
                                        this.firebaseError.bind( this)
                                      );
      this._initialized = true;
   }

   private doLogin(): void
   {
      let me = `${this._me}: doLogin()`;
      console.log( me);
      if (! this._authProvider)
         this._authProvider = new this._firebase.auth.GoogleAuthProvider();
      this._firebase.auth().signInWithRedirect( this._authProvider);
      this._firebase.auth().getRedirectResult().then( (function( result) {
         if (result.credential) {
            this._googleAccessToken = result.credential.accessToken;
            console.log( me + `: accessToken = "${this._googleAccessToken}`);
         }
         this._user = result.user;
         console.log( me + `: logged in user "${this._user}"`);
      }).bind( this)).catch( (function( error: Error) {
         console.log( `${me}: ${error.message}`)}).bind( this))
   }

   private firebaseError( anError: Error): void
   {
      console.log( `${this._me}: firebaseError(): ` + anError.message);
   }
   
   private clusterNamesValueChanged( aSnapshot: any)
   {
      console.log( `clusterNamesValueChanged(${aSnapshot})`);
      this._clusterNames = aSnapshot.val();
      console.log( `clusterNamesValueChanged(${aSnapshot}): clusterNames = ${this._clusterNames}`);
   }
   
   getClusterNames(): string[]
   {
      console.log( `${this._me}: getClusterNames()`);
      return new Array<string>();
   }
   
   loadCluster( aCluster: Cluster): void
   {
   }

   saveCluster( aCluster: Cluster): void
   {
   }

   /** Get cluster xml from some place wondrous and mysterious (like a server).
    */
   private getClusterXml(): string
   {
      return "";
   }

}
