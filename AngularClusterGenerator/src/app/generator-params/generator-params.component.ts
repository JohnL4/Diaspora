import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';

@Component({
  selector: 'app-generator-params',
  templateUrl: './generator-params.component.html',
  styleUrls: ['./generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit {

   private _numSystems: string; // = "6";
   get numSystems() : string { return this._numSystems; }
   set numSystems( value: string) { this._numSystems = value; }
   
   
   private _cluster: Cluster;
   
   constructor(aCluster: Cluster)
   {
      this._cluster = aCluster;
      if (aCluster.numSystems == null) {}
      else
         this._numSystems = aCluster.numSystems.toString();
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
