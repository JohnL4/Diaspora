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
   private static Semaphore __semaphore = new Semaphore( 0);
   private static HashMap<String, Object> __clusterUidToMetadataMap;
   private static HashMap<String, Object> __rewrittenClusterUidToMetadataMap = new HashMap<String, Object>();
   
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

//         dumpClusterMetadata();
         transformClusterMetadata();
//         __semaphore.acquire();
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
            __semaphore.release();
         }

         public void onCancelled( DatabaseError aDbError)
         {
            System.err.println( "Cancelled.  " + aDbError);
            __semaphore.release();
         }
      };
      kids.addListenerForSingleValueEvent( listener);
//      kids.addValueEventListener( listener);
   }

   private static void transformClusterMetadata() throws InterruptedException
   {
      final String me = App.class.getName() + ".transformClusterMetadata()";
      System.out.println( me);
      
      DatabaseReference dbRef = FirebaseDatabase.getInstance().getReference();
      final DatabaseReference kids = dbRef.child( "/clusters");

      ValueEventListener listener = new ValueEventListener() {

         private int _callCount = 0;
         
         public void onCancelled( DatabaseError aDbError)
         {
            System.err.println( me + "Cancelled.  " + aDbError);
            __semaphore.release();
         }

         public void onDataChange( DataSnapshot aSnapshot)
         {
            if (_callCount++ < 1)
            {
               try
               {
                  __clusterUidToMetadataMap = (HashMap<String, Object>) aSnapshot.getValue();
               }
               catch (Exception exc)
               {
                  System.err.println( exc.toString());
               }
            }
            else
            {
               Object snapshotObj = aSnapshot.getValue();
               System.out.printf( "Called more than once; releasing semaphore.  Received value is %s\n", snapshotObj);
            }
            __semaphore.release();
         }
      };      
      kids.addValueEventListener( listener);
      __semaphore.acquire(); // Wait for listener to release the semaphore.
      if (__clusterUidToMetadataMap == null)
      {
         // Do nothing
      }
      else
      {
         rewriteMetadata();
         System.out.printf( "New clusters object: %s\n", __rewrittenClusterUidToMetadataMap);
         kids.setValue( __rewrittenClusterUidToMetadataMap);
         __semaphore.acquire(); // Wait again for (hopefully) a data change event.
      }
   }

   private static void rewriteMetadata()
   {
      for (String uid : __clusterUidToMetadataMap.keySet())
      {
         // Transform "/clusters/uid/<metadata>" to
         // "/clusters/uid/metadata/<metadata>"
         Object metadataObj = __clusterUidToMetadataMap.get( uid);
         System.out.printf( "\t%s\n", uid);
         try
         {
            HashMap<String, Object> metadata = (HashMap<String, Object>) metadataObj;
            if (metadata.containsKey( "metadata"))
            {
               System.out.printf( "\t\tremove extraneous metadata\n");
               metadata.remove( "metadata");
            }
            // There's probably a better way to do this with
            // Streams, but it's more than I want to spend time on
            // right now.
            StringBuffer sb = new StringBuffer();
            for (String key : metadata.keySet())
            {
               sb.append( sb.length() > 0 ? ", " : "").append( key);
            }
            System.out.printf( "\t\twill proceed with metadata object containing %d keys (%s)\n",
                  metadata.keySet().size(), sb);
            HashMap<String,Object> newMetadataMap = new HashMap<>();
            newMetadataMap.put("metadata", metadata);
            __rewrittenClusterUidToMetadataMap.put( uid, newMetadataMap);
         }
         catch (Exception exc)
         {
            System.out.printf( "\t\tcast exception: %s\n", exc.toString());
         }
      }
   }

}
