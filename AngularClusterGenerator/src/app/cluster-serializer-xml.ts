import { Serializer } from './serializer';
import { Cluster } from './cluster';
import { StarSystem } from './star-system';
import { Slipstream } from './slipstream';

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
      console.log( `Serializer called ${this._callCount} times`); 
      let xml: string = `<?xml version="1.0"?>
<cluster xmlns="http://how-hard-can-it-be.com/diaspora"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://raw.githubusercontent.com/JohnL4/Diaspora/master/AngularClusterGenerator/src/app/cluster.xsd cluster.xsd">`;
      let indent: number = 0; // Indent level
      indent++;
      for (let sys of this.cluster.systems)
      {
         // TODO: sys.name really should be xml-encoded to escape double quotes.  Or maybe just the double quotes need
         // to be escaped?
         xml += `\n${this.indentStr(indent)}<starSystem id="${sys.id}" name="${sys.name}" technology="${sys.tech}" environment="${sys.environment}" resources="${sys.resources}">`;
//         for (let ss of sys.slipstreams)
//         {
//            if (ss.from == sys)
//               xml += `\n${this.indentStr(indent+1)}<slipstream to="${ss.to.name}"/>`;
//         }
         xml += `\n${this.indentStr(indent)}</starSystem>`;
      }
      for (let ss of this.cluster.slipstreams)
      {
         xml += `\n${this.indentStr(indent)}<slipstream from="${ss.from.id}" to="${ss.to.id}"/>`;
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

         let starSystems = new Array<StarSystem>();
         for (let i = 0; i < clusterChildNodes.length; i++)
         {
            if (clusterChildNodes[i].nodeType == Node.ELEMENT_NODE
                && clusterChildNodes[i].nodeName == "starSystem")
            {
               let starSysElt: Element = clusterChildNodes[i] as Element;
               starSystems.push( new StarSystem(
                  starSysElt.getAttribute( "id"),
                  starSysElt.getAttribute( "name"), 
                  Number( starSysElt.getAttribute( "technology")),
                  Number( starSysElt.getAttribute( "environment")),
                  Number( starSysElt.getAttribute( "resources"))
               ));
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
               let ss = new Slipstream( fromSys, toSys );
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
