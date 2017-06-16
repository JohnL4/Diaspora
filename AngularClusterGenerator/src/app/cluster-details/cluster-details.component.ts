import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs/Rx';

import { Cluster } from '../cluster';
import { CytoscapeGenerator } from '../cytoscape-generator';
import { PersistenceService } from '../persistence.service';
import { ClusterSerializerXML } from '../cluster-serializer-xml';

declare var cytoscape: any;

@Component({
  selector: 'app-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.css']
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {
   
   private _currentClusterSubscription: Subscription;

   public get cluster(): Subject<Cluster>
   {
      return this._persistenceSvc.currentClusterSubject;
   }
   
   constructor( /* private _cluster: Cluster, */ private _persistenceSvc: PersistenceService) {   }

   ngOnInit()
   {
      const me = this.constructor.name + `.ngOnInit(): `;
      console.log( me);

      // Can't figure out how to get cytoscape-cola in here.
      // let cycola = require( 'cytoscape-cola');
      // cycola( cytoscape);
      // cytoscape( 'layout', 'cola', cycola);
      
      // Neither does cose-bilkent work w/webpack and angular-cli. :(
      // let cose_bilkent = require( 'cytoscape-cose-bilkent');
      // cose_bilkent( cytoscape);

      this._currentClusterSubscription = this._persistenceSvc.currentClusterSubject.subscribe( () => this.layoutCytoscape());
      // this.layoutCytoscape();
   }

   ngOnDestroy()
   {
      const me = this.constructor.name + '.ngOnDestroy(): ';
      console.log( me);
      if (this._currentClusterSubscription)
         this._currentClusterSubscription.unsubscribe();
   }

   private layoutCytoscape(): void
   {
      let me = this.constructor.name + `.layoutCytoscape(): `;
      if (this._persistenceSvc.currentCluster)
      {
         const cygen = new CytoscapeGenerator( this._persistenceSvc.currentCluster);
         cygen.ensureStyles();
         const graphElements: Array<any> = cygen.getElements(); // this.elementsGraph( this._cluster);
         const styles: Array<any> = cygen.getStyles();
         const cyDiv = document.getElementById( 'cytoscapeDiv');
         if (cyDiv == null)
         {
            // do nothing. This method shouldn't get called, anyway, because we should have unsubscribed from the
            // relevant Observable in ngOnDestroy().
         }
         else
         {
            const cy = cytoscape({
               container: cyDiv,
               elements: graphElements,
               style: styles
               // layout: {name: 'cose'}
            });
         cy.layout({name: 'cose'});
         }
         console.log( me + `done`);
         // alert( me + `done`);
      }
      else
         console.log( me + 'NOTE: no cluster, so no CytoScape layout');
   }
}
