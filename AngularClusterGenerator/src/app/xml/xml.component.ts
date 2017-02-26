import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ClusterSerializerXML } from '../cluster-serializer-xml';
import { Cluster } from '../cluster';
import { StarSystem } from '../star-system';

@Component({
   selector: 'app-xml',
   templateUrl: './xml.component.html',
   styleUrls: ['./xml.component.css']
})
export class XmlComponent implements OnInit {

   private _cluster: Cluster;
   private _serializer: ClusterSerializerXML = new ClusterSerializerXML();

   private _xml: string;
   private _parser: DOMParser;
   
   @ViewChild( 'parseErrorDisplay') _parseErrorDisplay: ElementRef;

   constructor( aCluster: Cluster)
   {
      // Constructor is called every time we come back to this tab (because of the router?).
      // This means the private _xml member gets reset, so you can't use it to save data when you switch tabs.
      // Instead, probably need to inject something that the injector will instantiate only once.
      this._cluster = aCluster;

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
      if (this._cluster && this._cluster.numSystems)
      {
         this._serializer.cluster = this._cluster;
         return this._serializer.serialize();
      }
      else
         return this._xml;
   }

   public set xml( newXml: string)
   {
      console.log( "set xml called");
      this._xml = newXml;

      // For the following, probably want to do some sort of reactive input-event throttling, but for now, just
      // parse on every input event.

      this.clearErrorDisplay();
      let clusterDom : Document = this._parser.parseFromString( newXml, "text/xml");
      let clusterElt = clusterDom.documentElement;
      let starSysNodes = clusterElt.childNodes;
      let parserErrors = clusterElt.getElementsByTagName( "parsererror");
      if (parserErrors.length > 0)
      {
         // Root doc element isn't "cluster" (unexpected), but is "html".  Might be an error return, so attempt to display.
         // Reference through nativeElement is a nasty hack.  May return null if direct access to DOM is not possible.
         let displayElt : HTMLDivElement = this._parseErrorDisplay.nativeElement;
         if (displayElt)
         {
            for (let i = 0; i < parserErrors.length; i++)
            {
               displayElt.appendChild( parserErrors[i]);
            }
         }
      }
      else
      {
      let starSystems = new Array<StarSystem>();
      for (let i = 0; i < starSysNodes.length; i++)
      {
         if (starSysNodes[i].nodeType == Node.ELEMENT_NODE
             && starSysNodes[i].nodeName == "starSystem")
         {
            let starSysElt: Element = starSysNodes[i] as Element;
            starSystems.push( new StarSystem(
               starSysElt.getAttribute( "id"),
               Number( starSysElt.getAttribute( "technology")),
               Number( starSysElt.getAttribute( "environment")),
               Number( starSysElt.getAttribute( "resources"))
            ));
         }
      }
      if (starSystems.length > 0)
      {
         this._cluster.systems = starSystems;
         this._cluster.numSystems = starSystems.length; // TODO: this maybe should not be a standalone value.
      }
      }
   }

   /** Clear error display.
    */
   private clearErrorDisplay(): void
   {
      // Root doc element isn't "cluster" (unexpected), but is "html".  Might be an error return, so attempt to display.
      // Reference through nativeElement is a nasty hack.  May return null if direct access to DOM is not possible.
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
