import { Component } from '@angular/core';

import { AlertComponent } from 'ng2-bootstrap/ng2-bootstrap';
import { TAB_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

import { TabsComponent } from './tabs/tabs.component';
import { GeneratorParamsComponent } from './generator-params/generator-params.component';
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
      TabsComponent, GeneratorParamsComponent, XmlComponent, DotComponent
   ],
})
export class AppComponent {
  title = 'Diaspora Cluster Maintenance';
}
