import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';
import { ClusterPersistenceService } from '../cluster-persistence.service';

@Component({
  selector: 'app-session-ops',
  templateUrl: './session-ops.component.html',
  styleUrls: ['./session-ops.component.css']
})
export class SessionOpsComponent implements OnInit
{

   public get clusterName(): string { return this._cluster.name};
   public set clusterName( aName: string) { this._cluster.name = aName};
   
   constructor( private _cluster: Cluster, private _persistenceSvc: ClusterPersistenceService) { }

   ngOnInit()
   {
   }

   public login()
   {
      let me = this.constructor.name + ".login(): ";
      console.log( me + "logging in");
      this._persistenceSvc.login();
      // alert( me + 'done');
   }

   public logout()
   {
      let me = this.constructor.name + ".logout(): ";
      console.log( me + "logging out");
      this._persistenceSvc.logout();
   }

   public saveCluster(){}
}
