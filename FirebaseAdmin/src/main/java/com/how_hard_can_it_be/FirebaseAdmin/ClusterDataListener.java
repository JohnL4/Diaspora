package com.how_hard_can_it_be.FirebaseAdmin;

import java.util.HashMap;
import java.util.concurrent.Semaphore;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

public class ClusterDataListener implements ValueEventListener
{
   public HashMap<String,Object> clusterDataMap;

   /**
    * Used to coordinate access to data this listener receives.
    */
   public Semaphore semaphore;

   /**
    * 
    * @param aSemaphore Used to coordinate access to data this listener receives.
    */
   public ClusterDataListener( Semaphore aSemaphore)
   {
      semaphore = aSemaphore;
   }
   
   @Override
   public void onCancelled( DatabaseError aDbError)
   {
      String me = getClass().getName() + ".onCancelled(): "; 
      System.err.println( me + "Cancelled.  " + aDbError);
      semaphore.release();
   }

   @Override
   public void onDataChange( DataSnapshot aSnapshot)
   {
      clusterDataMap = (HashMap<String, Object>) aSnapshot.getValue();
      semaphore.release();
   }

}
