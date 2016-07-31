import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';

@Component({
  moduleId: module.id,
  selector: 'app-generator-params',
  templateUrl: 'generator-params.component.html',
  styleUrls: ['generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit {

   private cluster: Cluster;
   
  constructor() { }

  ngOnInit() {
  }

   public generateCluster( n: string)
   {
      this.cluster = new Cluster( 6);
      this.cluster.generateSystems();
   }
}
