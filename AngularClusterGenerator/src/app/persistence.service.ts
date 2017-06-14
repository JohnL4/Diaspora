import { Injectable } from '@angular/core';
import { Observable, Observer, BehaviorSubject, Subscription } from 'rxjs/Rx';

import * as firebase from 'firebase';

import { Cluster } from './cluster';
import { ClusterData } from './cluster-data';
import { ClusterSerializerXML } from './cluster-serializer-xml';
import { Uid } from './uid';
import { User } from './user';
import { ASCII_US, uniqueClusterName, minimalEncode, minimalDecode } from './utils';

// I'm thinking this thing stores serialized XML somewhere and retrieves it from somewhere.
//
// Maybe into a global variable (how do we set that up) and via a text field somewhere (how do we set that up)?  In
// future, a FireBase d/b, maybe?  Need to get credentials from user for FireBase.

/**
 * Makes several Observables available, which point to various parts of the persistent data store in Firebase.
 * See nosql.org to d/b structure.
 */
@Injectable()
export class PersistenceService 
{
   // --------------------------------------------  Public Data, Accessors  --------------------------------------------
   
   /**
    * Current User.
    */
   public get currentUser(): User { return this._curUser; }

   /**
    * The current cluster (which may not have been saved yet), as a Subject.
    */
   public get currentClusterSubject(): BehaviorSubject<Cluster> {
      return this._currentGeneratedCluster
         || this._currentPersistedCluster;
   }

   /**
    * The current cluster (which may not have been saved yet, and/or, in the case of a persisted cluster, may be out of
    * date).
    */
   public get currentCluster(): Cluster {
      return (this._currentGeneratedCluster && this._currentGeneratedCluster.value)
         || (this._currentPersistedCluster && this._currentPersistedCluster.value);
   }

   public set currentGeneratedCluster( aCluster: Cluster) {
      if (this._currentPersistedCluster || this._currentPersistedClusterSubscription)
      {
         if (this._currentPersistedClusterSubscription)
            this._currentPersistedClusterSubscription.unsubscribe();
         // TODO: unsubscribe or whatever needs to be done (the above is just a guess).
      }
      this._currentGeneratedCluster = new BehaviorSubject<Cluster>( aCluster);
   }

   /**
    * List cluster meadata objects sorted in the correct order (e.g., last edited by/when, notes, etc.).
    */
   public get clusterMetadata(): Observable<Cluster[]> { return this._clusterMetadata; }

   /**
    * Current cluster from persistent (possibly shared) store.
    */
   private get currentPersistedCluster(): BehaviorSubject<Cluster> { return this._currentPersistedCluster; }
   
   // -------------------------------------------------  Private Data  -------------------------------------------------
   
   /**
    * Map from cluster unique name to Cluster.  Zero or more of these clusters will have all data filled in (and not
    * necessarily up to date); the rest will have only metadata.
    */ 
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

//   /**
//    * List of names of clusters that are visible to the current user.
//    */
//   private _visibleClusters: BehaviorSubject<BehaviorSubject<Cluster>[]>;

   /**
    * Observable<Object>, in which each object has a property (probably a boolean, but could be an int) whose name
    * is the UID of a cluster and whose value is irrelevant.
    */
   // NOTE: Can't declare type Uuid as alias for string and have Typescript flag cases in which a non-Uuid is supplied here.  
   // The type equivalence doesn't save us.
   private _visibleClusterUuids: Observable<Object>; 

   private _visibleClusterMap: Map<Uid, Cluster>;
   private _visibleClusterMapSubject: BehaviorSubject<Map<Uid, Cluster>>;
   
   /**
    * Map from cluster unique name to a cluster, decorated as needed for processing ({@see SeenCluster} is the
    * decoration).
    */
   private _clusterObservable: Map<string, SeenCluster> = new Map<string, SeenCluster>();
   
   private _clusterMetadata: BehaviorSubject<Cluster[]> = new BehaviorSubject<Cluster[]>(new Array<Cluster>());


   private _currentGeneratedCluster: BehaviorSubject<Cluster>;
   private _currentGeneratedClusterSubscription: Subscription;
   
   private _currentPersistedCluster: BehaviorSubject<Cluster>;
   private _currentPersistedClusterSubscription: Subscription;
   
   private _curUser: User;
   
   private _initialized: boolean = false;

   private _xmlSerializer: ClusterSerializerXML;
   
   // -------------------------------------------------  Constructors  -------------------------------------------------
   
   constructor( )
   {
      const me = this.constructor.name + '.ctor(): '
      console.log( me + `=============================================================================================`);
   }

   // ------------------------------------------------  Public Methods  ------------------------------------------------
   
   /**
    * Initialize firebase and hook up AuthStateChanged event.
    */
   public init(): void
   {
      const me = this.constructor.name + '.init(): ';
      console.log( me);
      if (this._initialized)    // Probably not threadsafe, but I'll think about that tomorrow.  After all, tomorrow is another day.
      {
         console.log( me + 'already initialized');
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
    * Returns a User object for the given uid. May return null.
    */
   public getUser( aUid: string): User
   {
      let retval: User;
      if (this._latestUserMap)
         retval = this._latestUserMap.get( aUid);
      return retval;
   }

   /**
    * Initiate login to Firebase.
    */
   public login(): void
   {
      const me =  this.constructor.name + ".login(): ";
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
      const me = this.constructor.name + ".logout(): ";
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
   
   /**
    * Initiate a request to the back end to load the cluster.
    *
    * @param aUniqueName Minimally-encoded cluster name + ASCII US + user uid
    */
   public loadCluster( aUniqueName: string): void
   {
      const me = this.constructor.name + ".loadCluster(): ";
      // let uniqueName = JSON.stringify( minimalEncode( aUniqueName));
      const uniqueName = encodeURIComponent( aUniqueName);
      console.log( me + `loading ${uniqueName}`);
      if (this._currentPersistedCluster || this._currentPersistedClusterSubscription)
      {
         if (this._currentPersistedClusterSubscription)
            this._currentPersistedClusterSubscription.unsubscribe();
         if (this._currentGeneratedClusterSubscription)
         {
            this._currentGeneratedClusterSubscription.unsubscribe();
            this._currentGeneratedClusterSubscription = null;
         }
         if (this._currentGeneratedCluster)
            this._currentGeneratedCluster = null;
         
         // TODO: unsubscribe or whatever needs to be done (the above is just a guess).
      }
      this._currentPersistedCluster = new BehaviorSubject<Cluster>( new Cluster());
      this._currentPersistedClusterSubscription = this.makeDatabaseSnapshotObservable( `/clusterData/${uniqueName}`)
         .map( s => this.parseClusterData( s.val()))
         .multicast( this._currentPersistedCluster)
         .connect();
   }

   /**
    * Initiate a request to the back end to delete the given cluster.
    *
    * @param aUniqueName Same as that for {@see #loadCluster}.
    */
   public deleteCluster( aUniqueName: string):void
   {
      const me = this.constructor.name + ".deleteCluster(): ";
      const uniqueName = encodeURIComponent( aUniqueName);
      console.log( me + `deleting ${uniqueName}`);
      if (this._currentGeneratedClusterSubscription)
      {
         this._currentPersistedClusterSubscription.unsubscribe();
         this._currentPersistedClusterSubscription = null;
      }

      if (! this._db) this._db = firebase.database();
      this._db.ref( `/clusters/${uniqueName}`).remove();
      this._db.ref( `/clusterData/${uniqueName}`).remove();
   }
   
   public saveCluster( aCluster: Cluster): void
   {
      // let uniqueName = JSON.stringify( minimalEncode( uniqueClusterName( aCluster, this._curUser)));
      // const uniqueName = encodeURIComponent( uniqueClusterName( aCluster, this._curUser));
      let uniqueName: string;
      if (aCluster.uid)
         uniqueName = aCluster.uid;
      else
      {
         uniqueName = uniqueClusterName( aCluster, this._curUser);
         aCluster.uid = uniqueName; // Assumed to be a straight UUId.
      }
      const dbRef = this._db.ref();
      const updates = Object.create( null);

      // Clusters visible to current user: this one that we're saving, for sure.
      updates[`/users/${this._curUser.uid}/clusters/${aCluster.uid}`] = true;

      // Metadata
      const clusterProps = { 
            name: aCluster.name, 
            lastAuthor: this._curUser.uid,
            lastChanged: new Date( Date.now()), 
            notes: aCluster.notes ? aCluster.notes : ''
      };
      updates[`/clusters/${uniqueName}`] = clusterProps;
      
      // XML & other "full" cluster data
      this._xmlSerializer.cluster = aCluster;
      const xml = this._xmlSerializer.serialize();
      const owners = Object.create( null); // TODO: do we need this?
      owners[ `${this._curUser.uid}`] = 1;
      const clusterDataProps = { xml: xml,
                               owners: owners
                             };
      updates[`/clusterData/${uniqueName}`] = clusterDataProps;

      dbRef.update( updates);
   }

   /**
    * Get cluster xml from some place wondrous and mysterious (like a server).
    */
   public getClusterXml(): string
   {
      return "";
   }

   // -----------------------------------------------  Private Methods  ------------------------------------------------
   
   private authStateChanged( aFirebaseUser): void
   {
      const me = this.constructor.name + '.authStateChanged(): ';
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
            if (! this._db) this._db = firebase.database();
            const uidRef = this._db.ref( `/users/${this._curUser.uid}`);
            console.log( me + `uidRef = ${uidRef}`);
            const userProps = { name: this._curUser.name,
                              email: this._curUser.email,
                              lastLogin: this._curUser.lastLogin.toISOString(),
                              timeZoneOffset: this._curUser.lastLogin.getTimezoneOffset()
                            };
            uidRef.update( userProps); // Performs insert if key doesn't exist, so that's good.
            this.connectToDatabase();
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
      const me = this.constructor.name + '.authError(): ';
      console.log( me + `auth error: ${aFirebaseAuthError.message}`);
      this._userPromiseDeferred.reject( aFirebaseAuthError);
   }

   /**
    * Establish initial d/b connections. Note that initial connections may result in Observables/Promises which will
    * result in further connection requests.
    */
   private connectToDatabase()
   {
      const me = this.constructor.name + '.connectToDatabase(): ';
      if (this._curUser && this._curUser.uid)
      {
         this._db = firebase.database();
         console.log( me + `initialized firebase, db = "${this._db}"`);

         if (this._visibleClusterMap == null)
            this._visibleClusterMap = new Map<Uid, Cluster>();
         if (this._visibleClusterMapSubject == null)
         {
            this._visibleClusterMapSubject = new BehaviorSubject<Map<Uid, Cluster>>( this._visibleClusterMap);
            this._visibleClusterMapSubject.debounceTime( 300)
               .subscribe( m => this.sortMetadata( m));
         }

         // TODO: make this a BehaviorSubject<Map<string,Cluster>>.
         // this._visibleClusters = new BehaviorSubject<BehaviorSubject<Cluster>[]>(new Array<BehaviorSubject<Cluster>>());
         // this._visibleClusters.subscribe( clusters => this.handleVisibleClusterListChange( clusters));

         /* this._visibleClusterUuids = */ this.makeDatabaseSnapshotObservable( `/users/${this._curUser.uid}/clusters`)
            .map( s => <Object> s.val()) // Object of cluster uuids
            .subscribe( uidObject => this.handleVisibleClusterListChange( uidObject))
            ;

//         // $uid/clusters is a list of unique names
//         let visibleClusterNamesSubscription
//            = this.makeDatabaseSnapshotObservable( `/users/${this._curUser.uid}/clusters`) 
//            .map( s => { let uniqueNamesObj = s.val();
//                         let names = new Array<BehaviorSubject<Cluster>>();
//                         for (let uniqueName in uniqueNamesObj)
//                         {
//                            let cluster = this._clusterObservable[uniqueName].cluster;
//                            if (! cluster)
//                            {
//                               cluster = new Cluster();
//                               cluster.uid = uniqueName;
//                            }
//                            names.push( new BehaviorSubject<Cluster>( cluster));
//                         }
//                         return names;
//                       })
//            .multicast( this._visibleClusters)
//            .connect();
         
         // TODO: keep cluster metadata, but build differently.  Subscribe to each cluster separately, and provide next
         // result appropriately.  So... change in xml only, no next observable, but change in metadata ==> next result.
         // Change in _visbibleClusterNames almost certainly means at least a change in metadata ROWS (insert, delete).
         const clusterMetadataSubscription = this.makeDatabaseSnapshotObservable( '/clusters')
            .map( s => this.parseMetadata( s.val()))
            .multicast( this._clusterMetadata) // Uses the given Subject to create an Observable that can be subscribed
                                               //   to multiple times w/out re-triggering the sequence.
            .connect();                        // Actually starts the base Observable running, with updates to the
                                               //   subject.

         this._users = this.makeDatabaseSnapshotObservable( '/users').map( s => this.parseUsers( s.val()));
         this._users.subscribe( map => {this._latestUserMap = map;});

         // TODO: make Behavior Subject containing cluster arrays?  Answer: YES, probably a good idea.  Then we wouldn't
         // need to bother with this "latest" junk, because a BehaviorSubject will always have the latest value.

         // let subscription = this._clusterNamesObservable.subscribe(
         //    (snapshot: firebase.database.DataSnapshot) => this.clusterNamesValueChanged( snapshot)
         //    ,(err) => this.firebaseError( err) // Doesn't work.
         // );
      }
      else
         console.log( me + 'WARNING: current user not yet initialized; cannot establish references to user-specific data');
   }

   /**
    * Called when the list of names of clusters visible to the current user has changed, with the new list of Cluster
    * subjects.  Will drop subscriptions for deleted clusters and start new ones for new clusters.  Subscriptions for
    * existing clusters will continue unchanged.
    *
    * @param aClusterUidsObject DataSnapshot value whose properties are the currently visible cluster uuids.
    */
   private handleVisibleClusterListChange( aClusterUidsObject: Object): void
   {
      this._clusterObservable.forEach( sc => {sc.seen = false; });
      for (const clusterUid in aClusterUidsObject)
      {
         if (this._clusterObservable.has( clusterUid))
            this._clusterObservable.get( clusterUid).seen = true;
         else
         {
            const newCluster = new Cluster();
            newCluster.uid = clusterUid;
            // let clusterSubject = new BehaviorSubject<Cluster>( newCluster);
            const clusterSubscription = this.makeDatabaseSnapshotObservable( `/clusters/${clusterUid}`)
               .map( s => { const sval = s.val(); const c = new Cluster(); c.uid = clusterUid; c.name = sval.name; return c; })
               .subscribe( c => this.updateAndPublishClusterMap( c))
               ;
            const sc = new SeenCluster( true, newCluster, clusterSubscription);
         }
      }
      const unseenKeys = new Array<string>();
      this._clusterObservable.forEach( (val,key) =>
                                       {if (! val.seen) {
                                          unseenKeys.push( key);
                                          val.clusterSubscription.unsubscribe();
                                       }
                                       });
      for (const key of unseenKeys)
         this._clusterObservable.delete( key); 

      // At this point, the only piece of data we're guaranteed to have is cluster uid; and that doesn't do any good to
      // sort on.
      
   }

   /**
    * Updates map of visible clusters (uid --> cluster) and publishes the updated map via mapSubject.next().
    * @param aCluster 
    */   
   // Will honor every event by updating the map and calling subject.next(newMap).  However, said subject will be 
   // throttled before being sorted into a list for display.
   private updateAndPublishClusterMap( aCluster: Cluster): void
   {
      this._visibleClusterMap.set( aCluster.uid, aCluster);
      this._visibleClusterMapSubject.next( this._visibleClusterMap);
   }

   /**
    * Sort given map into a list of cluster metadata objects and raise an event to cause them to be displayed.
    * @param aClusterMetadataMap 
    */
   private sortMetadata( aClusterMetadataMap: Map<Uid, Cluster>)
   {
      const metadataList = new Array<Cluster>();
      aClusterMetadataMap.forEach( (cluster: Cluster, uid: Uid) => metadataList.push( cluster));
      metadataList.sort( (a,b) => 
            {
                  if (a.name < b.name) return -1;
                  else if (a.name == b.name) return 0;
                  else return 1;
            });
      this._clusterMetadata.next( metadataList);
   }
   
   /**
    * Makes an Observable of DataSnapshots out of a Firebase node, so the app can subscribe to new snapshots as they are
    * available.
    */
   private makeDatabaseSnapshotObservable( aNoSqlTreeNodeName: string): Observable<firebase.database.DataSnapshot>
   {
      if (! this._db) this._db = firebase.database();
      const dbRef = this._db.ref( aNoSqlTreeNodeName);
      const retval = Observable.fromEventPattern(
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

   /**
    * Records that a FireBase error has occurred.  (Doesn't do a whole lot more than that right now.)
    */ 
   private firebaseError( anError: Error): void
   {
      const me = "PersistenceService.firebaseError(): "; // this.constructor.name + ".firebaseError(): ";
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
      const me = this.constructor.name + ".parseMetadata(): ";
      this._latestClusterMap = new Map<string, Cluster>();
      const retval = Array<Cluster>();
      for (const key in aSnapshot)
      {
         // let keyTuple = minimalDecode( JSON.parse( key));
         let keyTuple = decodeURIComponent( key);
         let [name,uid] = keyTuple.split( ASCII_US, 2);
         name = minimalDecode( name);
         let clusterObj = <Cluster> aSnapshot[key]; // Note: just casting an Object (which is what I think aSnapshot[key]
                                                 // is, since Firebase knows nothing about our class hierarchy) to
                                                 // Cluster does not actually MAKE the thing a Cluster, it just
                                                 // satisfies TypeScript's demand for type "congruence".
         // clusterObj.lastAuthor = uid;
         // clusterObj.name = name;

         let cluster = new Cluster();
         cluster.lastChanged = clusterObj.lastChanged;
         cluster.lastAuthor = uid;
         cluster.name = name;

         retval.push( cluster); 
         this._latestClusterMap.set( key, cluster);
      }
      console.log( me + `aSnapshot contains ${retval.length} clusters`);
      return retval;
   }

   /**
    * Analogous to {@see #parseMetadata}, returns a Cluster object created from the given snapshot's "xml" property.
    */
   private parseClusterData( aSnapshot: Object): Cluster
   {
      const me = this.constructor.name + ".parseClusterData(): ";
      let retval: Cluster;
      if (aSnapshot)
      {
         const snapshot = <ClusterData> aSnapshot; 
         const serializer = new ClusterSerializerXML();
         const errors = serializer.deserialize( snapshot.xml);
         if (errors)
            console.log( me + `ERRORS:\n\t${errors}`);
         retval = serializer.cluster;
      }
      else
      {
         console.log( me + "NOTE: data snapshot is null, so no cluster");
         retval = null;
      }
      return retval;
   }

   private parseUsers( aSnapshot: Object): Map<string,User> {
      const me = this.constructor.name + ".parseUsers(): ";
      const retval = new Map<string,User>();
      for (const uid in aSnapshot)
      {
         let user = aSnapshot[uid];
         user.uid = uid;
         retval.set(uid, user);
      }
      console.log( me + `snapshot contains ${retval.size} users`);
      return retval;
   }
}

/**
 * A tuple decorating a cluster with a "seen" boolean for processing.
 */ 
class SeenCluster 
{
      /**
       * 
       * @param seen True iff cluster has been seen during processing
       * @param cluster The cluster itself
       * @param clusterSubscription Subscription to cluster updates
       */
   constructor( public seen: boolean, public cluster: Cluster, public clusterSubscription: Subscription) {}
}
