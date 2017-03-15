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

   public get user(): string { return this._user? this._user.toString() : null; }
   
   public init(): void
   {
      let me = this.constructor.name + '.init(): ';
      console.log( me);
      if (this._initialized)    // Probably not threadsafe, but I'll think about that tomorrow.  After all, tomorrow is another day.
      {
         console.log( me + "already initialized");
         return;
      }
      this._firebase = require( "firebase");
      let config = {
         apiKey: "AIzaSyBiNVpydoOUGJiIavCB3f8qvB6ARYSy_1E",
         authDomain: "diaspora-21544.firebaseapp.com",
         databaseURL: "https://diaspora-21544.firebaseio.com",
         storageBucket: "diaspora-21544.appspot.com",
         messagingSenderId: "222484722746"
      };
      this._firebase.initializeApp( config);

      let user = this._firebase.auth().currentUser; // This doesn't work -- always comes back null even when user is
                                                    // already logged in
      console.log( me + `current user: ${user}`);

      this._firebase.auth().onAuthStateChanged( this.authStateChanged.bind( this), this.authError.bind( this));

      this._initialized = true;
      console.log( me + "initialized");
   }

   private authStateChanged( aFirebaseUser): void
   {
      let me = this.constructor.name + '.authStateChanged(): ';
      if (aFirebaseUser)
      {
         this._user = aFirebaseUser.displayName || aFirebaseUser.email || aFirebaseUser.uid;
         console.log( me + `User logged in: ${this._user} with provider ${aFirebaseUser.providerId}`);
      }
      else
      {
         console.log( me + 'auth state changed, but passed user is null or empty, assuming logged out');
         this._user = null;
      }
   }

   private authError( aFirebaseAuthError): void
   {
      let me = this.constructor.name + '.authError(): ';
      this._user = null;
      console.log( me + `auth error: ${aFirebaseAuthError.message}`);
   }

   public connectToDatabase()
   {
      this._db = this._firebase.database();
      console.log( `${this._me}: initialized firebase, db = "${this._db}"`);
      // Re: .bind(this): See http://stackoverflow.com/a/20279485/370611
      this._db.ref( 'clusterNames').on( 'value',
                                        this.clusterNamesValueChanged.bind( this),
                                        this.firebaseError.bind( this)
                                      );
   }
   
   public login(): void
   {
      let me =  this.constructor.name + ".login(): ";
      console.log( me);
//      if (localStorage['loggingIn'])
//         console.log( me + `login in progress`);
//      else
//      {
//         localStorage['loggingIn'] = 'true';
         this._user = this._firebase.auth().currentUser;
         console.log( me + `before login attempt, current user = "${this._user}"`);
         if (! this._user)
         {
            if (! this._authProvider)
               this._authProvider = new this._firebase.auth.GoogleAuthProvider();
            console.log( me + "signing in with redirect");
            // alert( "signing in w/redirect");
            this._firebase.auth().signInWithRedirect( this._authProvider);
            // alert( "about to process redirect result");
            this._firebase.auth().getRedirectResult().then( (function( result) {
               if (result.credential) {
                  this._googleAccessToken = result.credential.accessToken;
                  console.log( me + `accessToken = "${this._googleAccessToken}`);
               }
               this._user = result.user;
               console.log( me + `logged in user "${this._user}"`);
               // alert( "login done");
            }).bind( this)).catch( (function( error: Error) {
               console.log( `${me} ${error.message}`)}).bind( this));
         }
         // alert( "doLogin() done");
//      }
//      localStorage.removeItem('loggingIn');
//      if (localStorage['loggingIn'])
//         console.log( me + `login STILL in progress`);
//      else
//         console.log( me + `login no longer in progress`);
      console.log( me + 'done');
   }

   public logout()
   {
      let me = this.constructor.name + ".logout(): ";
      // alert( "logging out");
      console.log( me);
      this._firebase.auth().signOut().then( function() {
         console.log( "signout successful");
      }).catch( function( anError: Error) {
         console.log( `signout error: ${anError.message}`);
      });
   }
   
   private firebaseError( anError: Error): void
   {
      console.log( `${this._me}: firebaseError(): ` + anError.message);
      // if (anError.message.match( /^permission_denied/))
      //    this.login();
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
