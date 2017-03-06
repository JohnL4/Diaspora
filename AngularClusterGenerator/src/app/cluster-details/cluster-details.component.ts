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
                  label: 'data(label)',
                  'background-opacity': '0.5',
                  width: 50,
                  height: 30,
                  shape: 'rectangle'
               }
            },
            {
               selector: 'node.t0e0r0',
               style: {
                  // 'background-color': 'green',
                  'background-opacity': 0,
                  width: 43,
                  height: 23,
                  'background-image': `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="43" height="23"><path fill="none" stroke="black" stroke-width="3" d="M 1,21 v -20 h 40 v 20 z M 21,1 v 20"/></svg>`,
                  // 'background-image': 'https://farm2.staticflickr.com/1261/1413379559_412a540d29_b.jpg'
                  'background-fit': 'none'
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
   private elementsGraph( aCluster: Cluster): any
   {
      let retval = { nodes: [], edges: []};
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
         retval.nodes.push( {data: {id: sys.id, label: sys.name}, classes: "t0e0r0"});
      }

      for (let slipstream of aCluster.slipstreams)
      {
         retval.edges.push( {data: {id: `${slipstream.from.id}-${slipstream.to.id}`,
                                              source: slipstream.from.id,
                                              target: slipstream.to.id }});
                                              
      }
      return retval;
   }
}
