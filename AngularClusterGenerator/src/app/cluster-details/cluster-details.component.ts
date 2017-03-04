import { Component, OnInit } from '@angular/core';

import { Cluster } from '../cluster';

@Component({
  selector: 'app-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.css']
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

   ngOnInit()
   {
      let cytoscape = require( 'cytoscape');

      // Can't figure out how to get cytoscape-cola in here.
      // let cycola = require( 'cytoscape-cola');
      // cycola( cytoscape);
      // cytoscape( 'layout', 'cola', cycola);
      
      // Neither does cose-bilkent work w/webpack and angular-cli. :(
      // let cose_bilkent = require( 'cytoscape-cose-bilkent');
      // cose_bilkent( cytoscape);

      let graphElements: Array<any> = this.elementsGraph( this._cluster);
      let cyDiv = document.getElementById( 'cytoscapeDiv');
      let cy = cytoscape({
         container: cyDiv,
         elements: graphElements,
         style: [
            {
               selector: 'node',
               style: {
                  label: 'data(label)'
               }
            },
            {
               selector: 'edge',
               style: {
                  'line-color': 'hsl(240, 100%, 80%)',
                  'curve-style': 'bezier', // Just in case we have two slipstreams between the same two systems.
                  'control-point-step-size': 20,
                  'source-label': '+',
                  'target-label': '-',
                  'source-text-offset': 10,
                  'target-text-offset': 10,
               }
            }
         ]
         // layout: {name: 'cose'}
      });
      cy.layout({name: 'cose'});
      console.log( `loaded cytoscape; cyDiv = ${cyDiv}; cy = ${cy} `);
  }

   /**
    * Returns an array of Cytoscape graph elements (nodes and edges).
    */
   private elementsGraph( aCluster: Cluster): Array<any>
   {
      let retval: Array<any> = new Array<any>();
//         = [
//            { data: {id: 'Alpha'}},
//            { data: {id: 'Bravo'}},
//            { data: {id: 'Charlie'}},
//            { data: {id: 'Delta'}},
//            { data: {id: 'Echo'}},
//
//            { data: {id: 'ab', source: 'Alpha', target: 'Bravo'}},
//            { data: {id: 'bc', source: 'Bravo', target: 'Charlie'}},
//            { data: {id: 'ac', source: 'Alpha', target: 'Charlie'}},
//            { data: {id: 'cd', source: 'Charlie', target: 'Delta'}},
//            { data: {id: 'da', source: 'Delta', target: 'Alpha'}},
//            { data: {id: 'db', source: 'Delta', target: 'Bravo'}},
//
//            // { data: {id: 'ae', source: 'Alpha', target: 'Echo'}},
//            // { data: {id: 'be', source: 'Bravo', target: 'Echo'}},
//            { data: {id: 'ce', source: 'Charlie', target: 'Echo'}},
//            { data: {id: 'de', source: 'Delta', target: 'Echo'}},
//      ];
      for (let sys of aCluster.systems)
      {
         retval.push( {group: 'nodes', data: {id: sys.id, label: sys.name}});
      }
      for (let slipstream of aCluster.slipstreams)
      {
         retval.push( {group: 'edges', data: {id: `${slipstream.from.id}-${slipstream.to.id}`,
                                              source: slipstream.from.id,
                                              target: slipstream.to.id }});
                                              
      }
      return retval;
   }
}
