import { Serializer } from './serializer';
import { Cluster } from './cluster';

export class ClusterSerializerDot implements Serializer
{
   cluster: Cluster;

   serialize(): string
   {
      return null;
   }

   deserialize( aString: string)
   {
      console.log( "Can't deserialize from dot(1) input");
      this.cluster = null;
   }
}
