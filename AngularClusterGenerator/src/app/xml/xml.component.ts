import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ClusterSerializerXML } from '../cluster-serializer-xml';
import { PersistenceService } from '../persistence.service';
import { Cluster } from '../cluster';
import { StarSystem } from '../star-system';
import { Slipstream } from '../slipstream';

@Component({
   selector: 'app-xml',
   templateUrl: './xml.component.html',
   styleUrls: ['./xml.component.css']
})
export class XmlComponent implements OnInit {

   private get cluster(): Cluster { return this._persistenceSvc.currentClusterSubject.value; }
   private _serializer: ClusterSerializerXML = new ClusterSerializerXML();

   private _xml: string;
   private _parser: DOMParser;
   
   @ViewChild( 'parseErrorDisplay') _parseErrorDisplay: ElementRef;

   constructor( /* aCluster: Cluster, */ private _persistenceSvc: PersistenceService)
   {
      // Constructor is called every time we come back to this tab (because of the router?).
      // This means the private _xml member gets reset, so you can't use it to save data when you switch tabs.
      // Instead, probably need to inject something that the injector will instantiate only once.
      // this._cluster = aCluster;

      if ((<any>window).DOMParser)
         this._parser = new (<any>window).DOMParser();
   }

   ngOnInit() {
   }

   public get parserExists(): boolean
   {
      if (this._parser)
         return true;
      else
         return false;
   }
   
   public get xml(): string
   {
      if (this.cluster && this.cluster.numSystems)
      {
         this._serializer.cluster = this.cluster;
         return this._serializer.serialize();
      }
      else
         return this._xml;
   }

   public set xml( newXml: string)
   {
      // console.log( "set xml called");
      this._xml = newXml;

      // For the following, probably want to do some sort of reactive input-event throttling, but for now, just
      // parse on every input event.

      this.clearErrorDisplay();
      let parserErrors = this._serializer.deserialize( newXml);
      if (parserErrors == null || parserErrors.length == 0)
      {
         this._persistenceSvc.currentGeneratedCluster = this._serializer.cluster;
         // this.cluster.copyFrom( this._serializer.cluster);
      }
      else
      {
         let displayElt : HTMLDivElement = this._parseErrorDisplay.nativeElement;
         if (displayElt)
         {
            for (let i = 0; i < parserErrors.length; i++)
            {
               displayElt.appendChild( parserErrors[i]); 
            }
         }
      }
   }

   /** Clear error display.
    */
   private clearErrorDisplay(): void
   {
      let displayElt : HTMLDivElement = this._parseErrorDisplay.nativeElement;
      if (displayElt)
      {
         while (displayElt.hasChildNodes())
         {
            displayElt.removeChild( displayElt.firstChild);
         }
      }
   }
}
