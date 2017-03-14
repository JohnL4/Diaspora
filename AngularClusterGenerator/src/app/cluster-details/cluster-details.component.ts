import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';
import { CytoscapeGenerator } from '../cytoscape-generator';
import { ClusterPersistenceService } from '../cluster-persistence.service';
import { ClusterSerializerXML } from '../cluster-serializer-xml';

@Component({
  selector: 'app-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.css']
})
export class ClusterDetailsComponent implements OnInit {

   private _cluster: Cluster;

   private _me = "ClusterDetailsComponent";
   
   public get Cluster(): Cluster
   {
      return this._cluster;
   }
   
   constructor( aCluster: Cluster, private _persistenceSvc: ClusterPersistenceService)
   {
      this._cluster = aCluster;
   }

   ngOnInit()
   {
      let me = `ngOnInit()`;
      console.log( me);
      this._persistenceSvc.init();
      this._persistenceSvc.getClusterNames();
      if (this._cluster.numSystems == 0)
      {
         let serializer = new ClusterSerializerXML();
         serializer.deserialize( localStorage.getItem( 'cluster'));
         this._cluster.copyFrom( serializer.cluster);
         console.log( `Deserialized ${this._cluster.numSystems} systems from localStorage`);
      }
      let cytoscape = require( 'cytoscape');

      // Can't figure out how to get cytoscape-cola in here.
      // let cycola = require( 'cytoscape-cola');
      // cycola( cytoscape);
      // cytoscape( 'layout', 'cola', cycola);
      
      // Neither does cose-bilkent work w/webpack and angular-cli. :(
      // let cose_bilkent = require( 'cytoscape-cose-bilkent');
      // cose_bilkent( cytoscape);

      let cygen = new CytoscapeGenerator( this._cluster);
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
      console.log( me + `: done`);
      // alert( me + `: done`);
  }
}
