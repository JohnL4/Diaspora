import { Injectable } from '@angular/core';

// I'm thinking this thing stores serialized XML somewhere and retrieves it from somewhere.
//
// Maybe into a global variable (how do we set that up) and via a text field somewhere (how do we set that up)?  In
// future, a FireBase d/b, maybe?  Need to get credentials from user for FireBase.

@Injectable()
export class ClusterPersistenceService {

  constructor() { }

   getClusterXml(): string
   {
      return "";
   }
}
