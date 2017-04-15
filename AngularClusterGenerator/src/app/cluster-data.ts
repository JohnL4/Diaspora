/**
 * Data Transfer Object.
 */ 
export class ClusterData
{
   /**
    * UIDs of Users allowed to change sharing and make edits, expressed as object properties.
    */ 
   public owners: Object;

   /**
    * UIDs of Users allowed to make edits, expressed as object properties.
    */ 
   public editors: Object;

   /**
    * UIDs of Users allowed to view this cluster, expressed as object properties.
    */ 
   public viewers: Object;

   /**
    * Complete XML of cluster.
    */
   public xml: string;
}
