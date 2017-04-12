import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

import * as firebase from "firebase";

import { Cluster } from './cluster';
import { ClusterSerializerXML } from './cluster-serializer-xml';
import { User } from './user';
import { ASCII_US, uniqueClusterName } from './utils';

// I'm thinking this thing stores serialized XML somewhere and retrieves it from somewhere.
//
// Maybe into a global variable (how do we set that up) and via a text field somewhere (how do we set that up)?  In
// future, a FireBase d/b, maybe?  Need to get credentials from user for FireBase.

/**
 * Makes several Observables available, which point to various parts of the persistent data store in Firebase.
 * See nosql.org to d/b structure.
 */
@Injectable()
export class ClusterPersistenceService 
{
   /**
    * Map from cluster name to cluster meadata (e.g., last edited by/when, notes, etc.)
    */
   public get clusterMetadata(): Observable<Cluster[]> { return this._clusterMetadata; }

   /**
    * Current cluster from persistent (possibly shared) store.
    */
   public get currentPersistedCluster(): BehaviorSubject<Cluster> { return this._currentPersistedCluster; }
   
   private _latestClusterMap: Map<string, Cluster>;
   
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

   private _users: Observable<Map<string,User>>;
   private _latestUserMap: Map<string,User>;
   
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
   
   private _clusterMetadata: BehaviorSubject<Cluster[]>;

   private _currentPersistedCluster: BehaviorSubject<Cluster>;
   
   /**
    * Current User.
    */
   public get curUser(): User { return this._curUser; }
   private _curUser: User;
   
   private _initialized: boolean = false;

   private _xmlSerializer: ClusterSerializerXML;
   
   /**
    * \x1F is ASCII US -- "Unit Separator" -- what we think of as a field separator.  I could have used any character
    * (e.g., NUL, but that might come with its own hassles), but there just happens to be an ASCII character exactly for
    * hijinks like this.
    */
   // private ASCII_US = "\x1F";

   // ------------------------------------------------  Public Methods  ------------------------------------------------
   
   constructor( )
   {
      let me = this.constructor.name + '.ctor(): '
      console.log( me + `=============================================================================================`);
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

      this._xmlSerializer = new ClusterSerializerXML();
      
      firebase.initializeApp( this._firebaseConfig);

      this._userPromise = new Promise(
         ( resolve, reject) => this._userPromiseDeferred = {resolve: resolve, reject: reject});
      
      firebase.auth().onAuthStateChanged( this.authStateChanged.bind( this), this.authError.bind( this));

      this._initialized = true;
      console.log( me + "initialized");
   }

   /**
    * Make Observables for various items in the Firebase database, from Firebase events.
    */
   public connectToDatabase()
   {
      let me = this.constructor.name + '.connectToDatabase(): ';

      this._db = firebase.database();
      console.log( me + `initialized firebase, db = "${this._db}"`);

      this._clusterMetadata = new BehaviorSubject<Cluster[]>(new Array<Cluster>());
      
      let clusterMetadataSubscription = this.makeDatabaseSnapshotObservable( '/clusters')
         .map( s => this.parseMetadata( s.val()))
         .multicast( this._clusterMetadata)
         .connect();

      this._users = this.makeDatabaseSnapshotObservable( '/users').map( s => this.parseUsers( s.val()));
      this._users.subscribe( map => {this._latestUserMap = map;});

      // TODO: make Behavior Subject containing cluster arrays?  Answer: YES, probably a good idea.  Then we wouldn't
      // need to bother with this "latest" junk, because a BehaviorSubject will always have the latest value.

      // let subscription = this._clusterNamesObservable.subscribe(
      //    (snapshot: firebase.database.DataSnapshot) => this.clusterNamesValueChanged( snapshot)
      //    ,(err) => this.firebaseError( err) // Doesn't work.
      // );
   }

   public getUser( aUid: string): User
   {
      let retval: User;
      if (this._latestUserMap)
         retval = this._latestUserMap.get( aUid);
      return retval;
   }

   public getCluster( aUniqueName: string): Cluster
   {
      let retval = this._latestClusterMap.get( aUniqueName);
      return retval;
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
   
   public get user(): Promise<User>
   {
      return this._userPromise;
   }
   
//   /**
//    * Returns a list of "shallow" clusters -- each cluster only contains metadata, not the full cluster data.
//    */
//   getClusters(): Cluster[]     // TODO: probably don't need this and can delete.
//   {
//      let me = this.constructor.name + ".getClusterNames(): ";
//      console.log( me + `getClusterNames()`);
//      return new Array<Cluster>();
//   }
   
   loadCluster( aCluster: Cluster): void
   {
   }

   saveCluster( aCluster: Cluster): void
   {
      let uniqueName = JSON.stringify( uniqueClusterName( aCluster, this._curUser));
      let dbRef = this._db.ref();
      let updates = Object.create( null);

      let clusterProps = { lastChanged: new Date( Date.now()) };
      updates[`/clusters/${uniqueName}`] = clusterProps;

      this._xmlSerializer.cluster = aCluster;
      let xml = this._xmlSerializer.serialize();
      let owners = Object.create( null);
      owners[ `${this._curUser.uid}`] = 1;
      let clusterDataProps = { xml: xml,
                               owners: owners
                             };
      updates[`/clusterData/${uniqueName}`] = clusterDataProps;

      dbRef.update( updates);
   }

   /**
    * Get cluster xml from some place wondrous and mysterious (like a server).
    */
   getClusterXml(): string
   {
      return "";
   }

   // -----------------------------------------------  Private Methods  ------------------------------------------------
   
   private authStateChanged( aFirebaseUser): void
   {
      let me = this.constructor.name + '.authStateChanged(): ';
      // let user: User;
      if (aFirebaseUser)
      {
         this._curUser = new User( aFirebaseUser.uid,
                          aFirebaseUser.displayName || aFirebaseUser.email || aFirebaseUser.uid,
                          aFirebaseUser.email,
                          new Date( Date.now()));
         console.log( me + `User logged in: ${this._curUser} with provider ${aFirebaseUser.providerId}`);
         if (this._curUser.uid)
         {
            let uidRef = this._db.ref( `/users/${this._curUser.uid}`);
            console.log( me + `uidRef = ${uidRef}`);
            let userProps = { name: this._curUser.name,
                              email: this._curUser.email,
                              lastLogin: this._curUser.lastLogin.toISOString(),
                              timeZoneOffset: this._curUser.lastLogin.getTimezoneOffset()
                            };
            uidRef.update( userProps); // Performs insert if key doesn't exist, so that's good.
         }
         else
            console.log( me + `WARNING: no uid for user ${this._curUser.name}`);
      }
      else
      {
         console.log( me + 'auth state changed, but passed user is null or empty, assuming logged out');
         this._curUser = null;
      }
      this._userPromiseDeferred.resolve( this._curUser); // We know _userPromiseDeferred won't be null because we create it
                                                      // before hooking up this event handler.
   }

   private authError( aFirebaseAuthError): void
   {
      let me = this.constructor.name + '.authError(): ';
      console.log( me + `auth error: ${aFirebaseAuthError.message}`);
      this._userPromiseDeferred.reject( aFirebaseAuthError);
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
         // .map((s,i) => <firebase.database.DataSnapshot>s)
      ;
   }

   private firebaseError( anError: Error): void
   {
      let me = "ClusterPersistenceService.firebaseError(): "; // this.constructor.name + ".firebaseError(): ";
      console.log( me + `firebaseError(): ` + anError.message);
      // if (anError.message.match( /^permission_denied/))
      //    this.login();
   }

   /**
    * Returns a map from cluster name to cluster metadata (e.g., last edited by/when, notes), which map is created from
    * the given d/b snapshot.
    */
   private parseMetadata( aSnapshot: Object): Cluster[]
   {
      let me = this.constructor.name + ".parseMetadata(): ";
      this._latestClusterMap = new Map<string, Cluster>();
      let retval = Array<Cluster>();
      for (let key in aSnapshot)
      {
         let keyTuple = JSON.parse( key);
         let [name,uid] = keyTuple.split( ASCII_US, 2);
         name = JSON.parse( name);
         let cluster = <Cluster> aSnapshot[key];
         cluster.lastAuthor = uid;
         cluster.name = name;
         retval.push( cluster);
         this._latestClusterMap.set( key, cluster);
      }
      console.log( me + `aSnapshot contains ${retval.length} clusters`);
      return retval;
   }

   private parseUsers( aSnapshot: Object): Map<string,User> {
      let me = this.constructor.name + ".parseUsers(): ";
      let retval = new Map<string,User>();
      for (let uid in aSnapshot)
      {
         let user = aSnapshot[uid];
         user.uid = uid;
         retval.set(uid, user);
      }
      console.log( me + `snapshot contains ${retval.size} users`);
      return retval;
   }
   
}
