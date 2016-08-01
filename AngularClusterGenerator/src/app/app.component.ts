import { Component, OnInit } from '@angular/core';

import { AlertComponent } from 'ng2-bootstrap/ng2-bootstrap';
import { TAB_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

import { TabsComponent } from './tabs/tabs.component';
import { GeneratorParamsComponent } from './generator-params/generator-params.component';
import { ClusterDetailsComponent } from './cluster-details/cluster-details.component';
import { XmlComponent } from './xml/xml.component';
import { DotComponent } from './dot/dot.component';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  templateUrl: 'app.component.html',
   styleUrls: ['app.component.css'],
   directives: [

      // ng2-bootstrap
      AlertComponent, TAB_DIRECTIVES,

      // app
      TabsComponent, GeneratorParamsComponent, ClusterDetailsComponent, XmlComponent, DotComponent
   ],
})
export class AppComponent implements OnInit
{
  title = 'Diaspora Cluster Maintenance';

   private tabs: Array<any>
/*
      = [
      {heading: "Params", content: "params content"}, //new GeneratorParamsComponent()},
      {heading: "Cluster", content: new ClusterDetailsComponent()},
      {heading: "XML", content: new XmlComponent()},
      {heading: "Dot", content: new DotComponent() },
   ]
*/
   ;

   private DOT_TAB_IX = 3;

   ngOnInit()
   {
      this.tabs = null;
   }
   
}
