import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';

@Component({
  moduleId: module.id,
  selector: 'app-generator-params',
  templateUrl: 'generator-params.component.html',
  styleUrls: ['generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit {

   public numSystems: string; // = "6";
   
   private _cluster: Cluster;
   
   constructor(aCluster: Cluster)
   {
      this._cluster = aCluster;
      // this.strSystems = this.numSystems.toString();
      // this.numSystems = "6"; // aCluster.numSystems.toString();
   }

  ngOnInit() {
  }

   public generateCluster()
   {
      // this._cluster = new Cluster( this.numSystems); // Don't new up, just update in place?
      this._cluster.numSystems = Number( this.numSystems);
      // this.cluster.generateSystems();
   }

   public revertParams()
   {
      this.numSystems = this._cluster.numSystems.toString();
   }
}
