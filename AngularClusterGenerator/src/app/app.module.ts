import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

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
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
