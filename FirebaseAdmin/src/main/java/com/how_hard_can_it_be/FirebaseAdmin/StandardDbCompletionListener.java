package com.how_hard_can_it_be.FirebaseAdmin;

import java.util.concurrent.Semaphore;

import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;

public class StandardDbCompletionListener implements DatabaseReference.CompletionListener
{
   private Semaphore _semaphore;
   
   /**
    * 
    * @param aSemaphore Used to synchronize completion call.  acquire() on semaphore to block for release
    * (assuming it's been created with zero permits).
    */
   public StandardDbCompletionListener( Semaphore aSemaphore)
   {
      _semaphore = aSemaphore;
   }
   
   public void onComplete( DatabaseError aDbError, DatabaseReference aDbRef)
   {
      if (aDbError == null)
         System.out.printf( "Data saved successfully.\n");
      else
         System.out.printf( "D/b error: %s - %s\n", aDbError.getCode(), aDbError.getMessage());
      _semaphore.release();
   }

}
