import { Injectable } from '@angular/core';

import { Cluster } from './cluster';

// I'm thinking this thing stores serialized XML somewhere and retrieves it from somewhere.
//
// Maybe into a global variable (how do we set that up) and via a text field somewhere (how do we set that up)?  In
// future, a FireBase d/b, maybe?  Need to get credentials from user for FireBase.

@Injectable()
export class ClusterPersistenceService {

  constructor() { }

   /** Get cluster xml from some place wondrous and mysterious (like a server).
    */
   private getClusterXml(): string
   {
      return "";
   }

   loadCluster( aCluster: Cluster): void
   {
   }

   saveCluster( aCluster: Cluster): void
   {
   }
}
