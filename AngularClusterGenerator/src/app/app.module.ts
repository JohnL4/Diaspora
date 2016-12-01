import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule }   from '@angular/router';

import { AppComponent } from './app.component';
import { ClusterDetailsComponent } from './cluster-details/cluster-details.component';
import { DotComponent } from './dot/dot.component';
import { GeneratorParamsComponent } from './generator-params/generator-params.component';
import { TabsComponent } from './tabs/tabs.component';
import { XmlComponent } from './xml/xml.component';

@NgModule({
   declarations: [
      AppComponent,
      ClusterDetailsComponent,
      DotComponent,
      GeneratorParamsComponent,
      TabsComponent,
      XmlComponent
   ],
   imports: [
      BrowserModule,
      FormsModule,
      HttpModule,
      RouterModule.forRoot([
         {
            path: '',           // Initial load.
            component: GeneratorParamsComponent
         },
         {
            path: 'params',
            component: GeneratorParamsComponent
         },
         {
            path: 'details',
            component: ClusterDetailsComponent
         },
         {
            path: 'xml',
            component: XmlComponent
         },
         {
            path: 'dot',
            component: DotComponent
         }
      ])
   ],
   providers: [],
   bootstrap: [AppComponent]
})
export class AppModule { }
