import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';
import { CytoscapeGenerator } from '../cytoscape-generator';
import { ClusterPersistenceService } from '../cluster-persistence.service';
import { ClusterSerializerXML } from '../cluster-serializer-xml';

declare var cytoscape: any;

@Component({
  selector: 'app-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.css']
})
export class ClusterDetailsComponent implements OnInit {

   public get cluster(): Cluster
   {
      return this._persistenceSvc.currentCluster;
   }
   
   constructor( /* private _cluster: Cluster, */ private _persistenceSvc: ClusterPersistenceService) {   }

   ngOnInit()
   {
      let me = this.constructor.name + `.ngOnInit(): `;
      console.log( me);

      // Can't figure out how to get cytoscape-cola in here.
      // let cycola = require( 'cytoscape-cola');
      // cycola( cytoscape);
      // cytoscape( 'layout', 'cola', cycola);
      
      // Neither does cose-bilkent work w/webpack and angular-cli. :(
      // let cose_bilkent = require( 'cytoscape-cose-bilkent');
      // cose_bilkent( cytoscape);

      let cygen = new CytoscapeGenerator( this.cluster);
      cygen.ensureStyles();
      let graphElements: Array<any> = cygen.getElements(); // this.elementsGraph( this._cluster);
      let styles: Array<any> = cygen.getStyles();
      let cyDiv = document.getElementById( 'cytoscapeDiv');
      let cy = cytoscape({
         container: cyDiv,
         elements: graphElements,
         style: styles
         // layout: {name: 'cose'}
      });
      cy.layout({name: 'cose'});
      console.log( me + `done`);
      // alert( me + `done`);
  }
}
