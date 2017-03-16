import { Injectable } from '@angular/core';

import { Cluster } from './cluster';
import { User } from './user';

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

   private _userPromise: Promise<User>;

   // On "deferred" promises: this is for the situation in which, when we create the promise ("new Promise(...)"), we do
   // not start the asynchronous/blocking work that will result in promise fulfillment.  Instead, that work has either
   // already been started or will be started elsewhere/elsewhen.  So, we simply save off an object holding pointers to
   // the resolve/reject functions so we can call them later (which we do).  See the handling of
   // this._userPromiseDeferred in this service.
   // 
   // See
   // http://stackoverflow.com/questions/31069453/creating-a-es6-promise-without-starting-to-resolve-it/31069505#31069505
   //
   private _userPromiseDeferred: {resolve: any, reject: any};
   
   private _me = "cluster-persistence.service.ts";
   private _initialized: boolean = false;
   
   constructor()
   {
      console.log( `${this._me}: ctor`);
   }

   public get user(): Promise<User>
   {
      return this._userPromise;
   }
   
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

      this._userPromise = new Promise(
         ( resolve, reject) => this._userPromiseDeferred = {resolve: resolve, reject: reject});
      
      this._firebase.auth().onAuthStateChanged( this.authStateChanged.bind( this), this.authError.bind( this));

      this._initialized = true;
      console.log( me + "initialized");
   }

   private authStateChanged( aFirebaseUser): void
   {
      let me = this.constructor.name + '.authStateChanged(): ';
      let user: User;
      if (aFirebaseUser)
      {
         user = new User( aFirebaseUser.displayName || aFirebaseUser.email || aFirebaseUser.uid,
                          aFirebaseUser.uid);
         console.log( me + `User logged in: ${user} with provider ${aFirebaseUser.providerId}`);
      }
      else
      {
         console.log( me + 'auth state changed, but passed user is null or empty, assuming logged out');
         user = null;
      }
      this._userPromiseDeferred.resolve( user); // We know _userPromiseDeferred won't be null because we create it
                                                      // before hooking up this event handler.
   }

   private authError( aFirebaseAuthError): void
   {
      let me = this.constructor.name + '.authError(): ';
      console.log( me + `auth error: ${aFirebaseAuthError.message}`);
      this._userPromiseDeferred.reject( aFirebaseAuthError);
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
      let clusterNames = aSnapshot.val();
      console.log( `clusterNamesValueChanged(${aSnapshot}): clusterNames = ${clusterNames}`);
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
