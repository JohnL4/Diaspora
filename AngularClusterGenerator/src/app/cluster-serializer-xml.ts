import { Serializer } from './serializer';
import { Cluster } from './cluster';

/**
 * Serializes/deserializes cluster to/from XML.
 */
export class ClusterSerializerXML implements Serializer
{
   cluster: Cluster;

   private _callCount: number = 0;

   private _space: String = new String(" ");

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
         xsi:schemaLocation="https://s3.amazonaws.com/JohnLuskPublic/cluster.xsd cluster.xsd">`;
      let indent: number = 0; // Indent level
      indent++;
      for (let sys of this.cluster.systems)
      {
         xml += `\n${this.indentStr(indent)}<starSystem id="${sys.name}" technology="${sys.tech}" environment="${sys.environment}" resources="${sys.resources}">`;
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

   deserialize(aString: string)
   {
      this.cluster = null;      // TODO: transfer from xml component?
   }

   private indentStr( anIndent: number): string
   {
      return this._space.repeat( 2 * anIndent);
   }
}
