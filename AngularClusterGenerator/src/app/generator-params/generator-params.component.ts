import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';

@Component({
  moduleId: module.id,
  selector: 'app-generator-params',
  templateUrl: 'generator-params.component.html',
  styleUrls: ['generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit {

   public numSystems: number = 6;
   public strSystems: string;
   
   private cluster: Cluster;
   
  constructor()
   {
      this.strSystems = this.numSystems.toString();
   }

  ngOnInit() {
  }

   public generateCluster()
   {
      this.cluster = new Cluster( this.numSystems);
      // this.cluster.generateSystems();
   }

   public revertParams()
   {
      this.strSystems = this.numSystems.toString();
   }
}
