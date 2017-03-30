import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

import * as firebase from "firebase";

import { Cluster } from './cluster';
import { User } from './user';

// I'm thinking this thing stores serialized XML somewhere and retrieves it from somewhere.
//
// Maybe into a global variable (how do we set that up) and via a text field somewhere (how do we set that up)?  In
// future, a FireBase d/b, maybe?  Need to get credentials from user for FireBase.

/**
 * Makes several Observables available, which point to various parts of the persistent data store in Firebase.
 */
@Injectable()
export class ClusterPersistenceService 
{
   public get clustersObservable(): Observable<Cluster[]> { return this._clustersObservable; }
   public get clusterNamesObservable(): Observable<firebase.database.DataSnapshot> { return this._clusterNamesObservable }

   private _firebaseConfig = {
            apiKey: "AIzaSyBiNVpydoOUGJiIavCB3f8qvB6ARYSy_1E",
            authDomain: "diaspora-21544.firebaseapp.com",
            databaseURL: "https://diaspora-21544.firebaseio.com",
            storageBucket: "diaspora-21544.appspot.com",
            messagingSenderId: "222484722746"
      };

   // private _ui: any;            // Firebase ui
   private _db: firebase.database.Database;
   private _authProvider: firebase.auth.GoogleAuthProvider;
   private _googleAccessToken: firebase.auth.AuthCredential;

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
   
   private _clusterNamesObservable: Observable<firebase.database.DataSnapshot>;
   private _clustersObservable: Observable<Cluster[]>;

   private _initialized: boolean = false;
   
   constructor( )
   {
      let me = this.constructor.name + '.ctor(): '
      console.log( me + `=============================================================================================`);
   }

   public get user(): Promise<User>
   {
      return this._userPromise;
   }
   
   /**
    * Initialize firebase and hook up AuthStateChanged event.
    */
   public init(): void
   {
      let me = this.constructor.name + '.init(): ';
      console.log( me);
      if (this._initialized)    // Probably not threadsafe, but I'll think about that tomorrow.  After all, tomorrow is another day.
      {
         console.log( me + "already initialized");
         return;
      }

      firebase.initializeApp( this._firebaseConfig);

      this._userPromise = new Promise(
         ( resolve, reject) => this._userPromiseDeferred = {resolve: resolve, reject: reject});
      
      firebase.auth().onAuthStateChanged( this.authStateChanged.bind( this), this.authError.bind( this));

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

   /**
    * Make Observables for various items in the Firebase database, from Firebase events.
    */
   public connectToDatabase()
   {
      let me = this.constructor.name + '.connectToDatabase(): ';
      this._db = firebase.database();
      console.log( me + `initialized firebase, db = "${this._db}"`);

      // TODO: put this handful of Observation-making code into a reusable subroutine, since there's nothing specific to
      // the snapshots generated here.
      this._clusterNamesObservable = this.makeDatabaseSnapshotObservable( 'clusterNames');

      // TODO: make Behavior Subject containing cluster arrays?
      

      // let subscription = this._clusterNamesObservable.subscribe(
      //    (snapshot: firebase.database.DataSnapshot) => this.clusterNamesValueChanged( snapshot)
      //    ,(err) => this.firebaseError( err) // Doesn't work.
      // );
   }

   private makeDatabaseSnapshotObservable( aNoSqlTreeNodeName: string): Observable<firebase.database.DataSnapshot>
   {
      if (! this._db) this._db = firebase.database();
      let dbRef = this._db.ref( aNoSqlTreeNodeName);
      let retval = Observable.fromEventPattern(
         (function addHandler( h: (a: firebase.database.DataSnapshot, b?: string) => any) {
            // Need to explicitly bind to firebaseError here because there's no easy way (that I can tell) to
            // generate/catch errors using the Observable subscription.
            dbRef.on( 'value', h, this.firebaseError); }).bind(this), 
         function delHandler( h: (a: firebase.database.DataSnapshot, b?: string) => any) {
            dbRef.off( 'value', h);
         }
         // ,(aSnapshot: firebase.database.DataSnapshot) => aSnapshot
      );
      return retval
         .map((s,i) => <firebase.database.DataSnapshot>s)
      ;
   }

   /**
    * Initiate login to Firebase.
    */
   public login(): void
   {
      let me =  this.constructor.name + ".login(): ";
      console.log( me);
      if (! this._authProvider)
         this._authProvider = new firebase.auth.GoogleAuthProvider();
      console.log( me + "signing in with redirect");
      // alert( "signing in w/redirect");
      firebase.auth().signInWithRedirect( this._authProvider);
      // alert( "about to process redirect result");
      firebase.auth().getRedirectResult().then( (function( result: firebase.auth.UserCredential) {
         if (result.credential) {
            this._googleAccessToken = result.credential;
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
      firebase.auth().signOut().then( function() {
         console.log( "signout successful");
      }).catch( function( anError: Error) {
         console.log( `signout error: ${anError.message}`);
      });
   }
   
   private firebaseError( anError: Error): void
   {
      let me = "ClusterPersistenceService.firebaseError(): "; // this.constructor.name + ".firebaseError(): ";
      console.log( me + `firebaseError(): ` + anError.message);
      // if (anError.message.match( /^permission_denied/))
      //    this.login();
   }
   
//    private clusterNamesValueChanged( aSnapshot: firebase.database.DataSnapshot)
//    {
//       console.log( `clusterNamesValueChanged(${aSnapshot})`);
//       let clusterNames = aSnapshot.val();
//       console.log( `clusterNamesValueChanged(${aSnapshot}): clusterNames = ${clusterNames}`);
//    }
   
   getClusterNames(): string[]
   {
      let me = this.constructor.name + ".getClusterNames(): ";
      console.log( me + `getClusterNames()`);
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
