import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';

@Component({
  moduleId: module.id,
  selector: 'app-cluster-details',
  templateUrl: 'cluster-details.component.html',
  styleUrls: ['cluster-details.component.css']
})
export class ClusterDetailsComponent implements OnInit {

   private _cluster: Cluster;

   public get Cluster(): Cluster
   {
      return this._cluster;
   }
   
   constructor( aCluster: Cluster)
   {
      this._cluster = aCluster;
   }

  ngOnInit() {
  }

}
