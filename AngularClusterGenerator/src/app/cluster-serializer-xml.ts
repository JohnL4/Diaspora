import { Serializer } from './serializer';
import { Cluster } from './cluster';
import { StarSystem } from './star-system';
import { Slipstream } from './slipstream';
import { SlipknotPosition } from './slipknot-position';

/**
 * Serializes/deserializes cluster to/from XML.
 */
export class ClusterSerializerXML implements Serializer
{
   cluster: Cluster;

   private _callCount: number = 0;

   private _space: String = new String(" ");

   private _parser: DOMParser;

   constructor()
   {
      if ((<any>window).DOMParser)
         this._parser = new (<any>window).DOMParser();
   }
   
   /**
    * Serialize this.cluster to XML.
    */
   serialize() : string
   {
      this._callCount++;
      // console.log( `Serializer called ${this._callCount} times`); 
      let xml: string = `<?xml version="1.0"?>
<cluster xmlns="http://how-hard-can-it-be.com/diaspora"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://how-hard-can-it-be.com/diaspora https://raw.githubusercontent.com/JohnL4/Diaspora/master/AngularClusterGenerator/src/app/cluster.xsd"`;
      if (this.cluster.usesHighLowSlipstreams)
      {
         xml += `
         usesHighLowSlipstreams="${this.cluster.usesHighLowSlipstreams}"`;
      }
      xml += '>';
      let indent: number = 0; // Indent level
      indent++;
      for (let sys of this.cluster.systems)
      {
         // TODO: sys.name really should be xml-encoded to escape double quotes.  Or maybe just the double quotes need
         // to be escaped?
         let nameEsc = encodeURIComponent(sys.name);
         // console.log( `nameEsc = "${nameEsc}"`);
         xml += `\n${this.indentStr(indent)}<starSystem id="${sys.id}" name="${nameEsc}" technology="${sys.tech}" environment="${sys.environment}" resources="${sys.resources}">`;
         for (let i = 0; i < 3; i++)
         {
            let aspectEsc = sys.aspects[i] ? encodeURIComponent( sys.aspects[i]) : "";
            // console.log( `aspectEsc[${i}] = "${aspectEsc}"`);
            xml += `\n${this.indentStr(indent+1)}<aspect>${aspectEsc}</aspect>`;
         }
         let notesEsc = sys.notes ? encodeURIComponent( sys.notes) : "";
         // console.log( `notesEsc = "${notesEsc}"`);
         xml += `\n${this.indentStr(indent+1)}<notes>${notesEsc}</notes>`;
         xml += `\n${this.indentStr(indent)}</starSystem>`;
      }
      for (let ss of this.cluster.slipstreams)
      {
         xml += `\n${this.indentStr(indent)}<slipstream from="${ss.from.id}" to="${ss.to.id}"`;
         if (this.cluster.usesHighLowSlipstreams)
            xml += ` leave="${SlipknotPosition[ ss.leave]}" arrive="${SlipknotPosition[ ss.arrive]}"`;
         xml += `/>`;
      }
      xml += "\n</cluster>";
      return xml;
   }

   /**
    * Parse XML string into this.cluster, returning list of errors, if any.  Otherwise, returns null.
    */
   deserialize(aString: string): NodeListOf<Element>
      {
         this.cluster = new Cluster();

         let clusterDom : Document = this._parser.parseFromString( aString, "text/xml");
         let clusterElt = clusterDom.documentElement;
         let clusterChildNodes = clusterElt.childNodes;
         let parserErrors = clusterElt.getElementsByTagName( "parsererror");
         if (parserErrors.length > 0)
         {
            return parserErrors;
         }

         let usesHighLowAttr: string = clusterElt.getAttribute( "usesHighLowSlipstreams");
         if (usesHighLowAttr != null && usesHighLowAttr.length > 0)
            this.cluster.usesHighLowSlipstreams = Boolean( usesHighLowAttr);
         
         let starSystems = new Array<StarSystem>();
         for (let i = 0; i < clusterChildNodes.length; i++)
         {
            if (clusterChildNodes[i].nodeType == Node.ELEMENT_NODE
                && clusterChildNodes[i].nodeName == "starSystem")
            {
               let starSysElt: Element = clusterChildNodes[i] as Element;
               let sys = new StarSystem(
                  starSysElt.getAttribute( "id"),
                  decodeURIComponent(starSysElt.getAttribute( "name")), 
                  Number( starSysElt.getAttribute( "technology")),
                  Number( starSysElt.getAttribute( "environment")),
                  Number( starSysElt.getAttribute( "resources")));
               let aspectElts = starSysElt.getElementsByTagName( "aspect");
               for (let j = 0; j < 3; j++)
               {
                  sys.aspects[j] = decodeURIComponent( aspectElts[j].textContent);
               }
               let notesElt = starSysElt.getElementsByTagName( "notes")[0];
               sys.notes = decodeURIComponent( notesElt.textContent);
               starSystems.push( sys);
            }
         }
         if (starSystems.length > 0)
         {
            this.cluster.systems = starSystems;
         }

         this.cluster.slipstreams = new Array<Slipstream>();
         for (let i = 0; i < clusterChildNodes.length; i++)
         {
            if (clusterChildNodes[i].nodeType == Node.ELEMENT_NODE
                && clusterChildNodes[i].nodeName == "slipstream")
            {
               let slipstreamElt = clusterChildNodes[i] as Element;
               let from = slipstreamElt.getAttribute( "from");
               let to = slipstreamElt.getAttribute( "to");
               let fromSys = this.cluster.systemMap.get( from);
               let toSys = this.cluster.systemMap.get( to);

               let leave: SlipknotPosition = null;
               let arrive: SlipknotPosition = null;
               if (this.cluster.usesHighLowSlipstreams)
               {
                  let leaveAttr: string = slipstreamElt.getAttribute( "leave");
                  let arriveAttr: string = slipstreamElt.getAttribute( "arrive");
                  if (leaveAttr != null && leaveAttr.length > 0 && arriveAttr != null && arriveAttr.length > 0)
                  {
                     leave = SlipknotPosition[ leaveAttr];
                     arrive = SlipknotPosition[ arriveAttr];
                  }
                  else
                     throw "Cluster uses high/low slipknot positions, but XML doesn't specify values for slipstreams";
               }
               
               let ss = new Slipstream( fromSys, toSys, leave, arrive );
               this.cluster.slipstreams.push( ss);
               fromSys.slipstreams.push( ss);
               toSys.slipstreams.push( ss);
            }
         }
         return null;              // No errors.
      }

   private indentStr( anIndent: number): string
   {
      return this._space.repeat( 2 * anIndent);
   }
}
