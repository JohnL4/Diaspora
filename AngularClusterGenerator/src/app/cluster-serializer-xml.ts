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
   
   serialize() : string
   {
      this._callCount++;
      console.log( `Serializer called ${this._callCount} times`); // TODO: we get called WAY too many times.
      let xml: string = "<?xml version='1.0'?>\n<cluster>"; // TODO: xmlns? xsd?
      let indent: number = 0; // Indent level
      indent++;
      for (let sys of this.cluster.systems)
      {
         xml += `\n${this.indentStr(indent)}<starSystem id="${sys.name}" technology="${sys.tech}" environment="${sys.environment}" resources="${sys.resources}"/>`;
      }
      xml += "\n</cluster>";
      return xml;
   }

   deserialize(aString: string)
   {
      this.cluster = null;
   }

   private indentStr( anIndent: number): string
   {
      return this._space.repeat( 2 * anIndent);
   }
}
