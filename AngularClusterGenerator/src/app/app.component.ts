import { Component } from '@angular/core';

import { AlertComponent } from 'ng2-bootstrap/ng2-bootstrap';

import { TabsComponent } from './tabs/tabs.component';
import { GeneratorParamsComponent } from './generator-params/generator-params.component';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  templateUrl: 'app.component.html',
   styleUrls: ['app.component.css'],
   directives: [

      // ng2-bootstrap
      AlertComponent,

      // app
      TabsComponent, GeneratorParamsComponent],
})
export class AppComponent {
  title = 'Diaspora Cluster Maintenance';
}
