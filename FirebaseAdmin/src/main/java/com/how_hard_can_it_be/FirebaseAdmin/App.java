package com.how_hard_can_it_be.FirebaseAdmin;

import java.io.FileInputStream;
import java.util.HashMap;
import java.util.concurrent.Semaphore;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseCredentials;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Hello world!
 *
 */
public class App 
{
   private static Semaphore semaphore = new Semaphore( 0);
   
   public static void main( String[] args) throws InterruptedException
   {
      try
      {
//         System.out.println(  "Classpath = " + System.getProperties().getProperty( "java.class.path"));
         
         FileInputStream serviceAccount = new FileInputStream( "diaspora-dev-firebase-adminsdk-voul2-9fc9e89711.json");

         FirebaseOptions options = new FirebaseOptions.Builder()
               .setCredential( FirebaseCredentials.fromCertificate( serviceAccount))
               .setDatabaseUrl( "https://diaspora-dev.firebaseio.com/").build();

         FirebaseApp.initializeApp( options);

         dumpClusterMetadata();
         semaphore.acquire();
      }
      catch (Exception exc)
      {
         System.err.println( "Error: " + exc.toString());
      }
      System.out.println( "(Firebase admin done.)");
      System.exit( 0);
   }

   private static void dumpClusterMetadata()
   {
      System.out.println( "Cluster metadata:");

      DatabaseReference dbRef = FirebaseDatabase.getInstance().getReference();
      DatabaseReference kids = dbRef.child( "/clusters");

      ValueEventListener listener = new ValueEventListener() {

         public void onDataChange( DataSnapshot aSnapshot)
         {
            try
            {
               HashMap<String, Object> clusterUidToMetadataMap = (HashMap<String, Object>) aSnapshot.getValue();
               for (String uid : clusterUidToMetadataMap.keySet())
               {
                  Object metadata = clusterUidToMetadataMap.get( uid);
                  System.out.println( "\tgot value " + uid + ": " + metadata);
               }
            }
            catch (Exception exc)
            {
               System.err.println( exc.toString());
            }
            semaphore.release();
         }

         public void onCancelled( DatabaseError aDbError)
         {
            System.err.println( "Cancelled.  " + aDbError);
            semaphore.release();
         }
      };
      kids.addListenerForSingleValueEvent( listener);
//      kids.addValueEventListener( listener);
   }
}
