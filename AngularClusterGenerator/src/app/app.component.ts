import { Component, OnInit } from '@angular/core';

// import { AlertComponent } from 'ng2-bootstrap/ng2-bootstrap';
// import { TAB_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

// Not sure we need all these components here.  Might just need in app.module.ts.
// import { TabsComponent } from './tabs/tabs.component';
// import { GeneratorParamsComponent } from './generator-params/generator-params.component';
// import { ClusterDetailsComponent } from './cluster-details/cluster-details.component';
// import { XmlComponent } from './xml/xml.component';
// import { DotComponent } from './dot/dot.component';

import { ClusterPersistenceService } from './cluster-persistence.service';

import { Cluster } from './cluster';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
   styleUrls: ['./app.component.css'],
   providers: [Cluster, ClusterPersistenceService],
})
export class AppComponent implements OnInit
{
   title = 'Diaspora Cluster Maintenance';

   private _cluster: Cluster; // Not at all sure this is used.  HOW DO WE DEBUG??

   constructor( private _persistenceSvc: ClusterPersistenceService) {}

   ngOnInit()
   {
      let me = this.constructor.name + ".ngOnInit(): ";
      console.log( me);
      this._persistenceSvc.init();
      // this._persistenceSvc.logout();
      // this._persistenceSvc.login();
      this._persistenceSvc.connectToDatabase();
      this._persistenceSvc.getClusterNames();
      console.log( me + 'done');
   }
   
}
