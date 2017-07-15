package com.how_hard_can_it_be.FirebaseAdmin;

import java.io.FileInputStream;
import java.util.HashMap;
import java.util.concurrent.Semaphore;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseCredentials;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Firebase d/b migration utility; will probably have code modified for every new transformation.
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
         
         Option envOpt = Option.builder()
               .longOpt( "env")
               .required()
               .hasArg()
               .desc( "environment: prod or dev")
               .build();

         Options opts = new Options();
         opts.addOption( envOpt);
         CommandLineParser cmdLineParser = new DefaultParser();
         CommandLine cmd = cmdLineParser.parse( opts, args);
         
         String env = cmd.getOptionValue( "env");

         // Separate argument-checking from argument-using.  Check ALL args first.
         if (env.equals( "dev") || env.equals( "prod"))
         {
            // Do nothing, we're good.
         }
         else
            throw new Exception( "--env option must be either 'prod' or 'dev'");
         
         if (env.equals( "dev"))
         {
            FileInputStream serviceAccount = new FileInputStream(
                  "diaspora-dev-firebase-adminsdk-voul2-9fc9e89711.json");

            FirebaseOptions options = new FirebaseOptions.Builder()
                  .setCredential( FirebaseCredentials.fromCertificate( serviceAccount))
                  .setDatabaseUrl( "https://diaspora-dev.firebaseio.com/").build();

            FirebaseApp.initializeApp( options);
         }
         else if (env.equals( "prod"))
         {
            FileInputStream serviceAccount = new FileInputStream(
                  "diaspora-21544-firebase-adminsdk-ak9wa-54c386f740.json");

            FirebaseOptions options = new FirebaseOptions.Builder()
                  .setCredential( FirebaseCredentials.fromCertificate( serviceAccount))
                  .setDatabaseUrl( "https://diaspora-21544.firebaseio.com").build();

            FirebaseApp.initializeApp( options);
         }
         
//       transformClusterMetadata();
//       pushClusterXmlDownAndRenameClusterOwners();
         copyWritersIntoReaders();
//         __semaphore.acquire();
      }
      catch (Exception exc)
      {
         System.err.println( "Error: " + exc.toString());
      }
      System.out.println( "(Firebase admin done.)");
      System.exit( 0);
   }

   /**
    * Copy /clusterData/$uid/writers into /clusterData/$uid/readers (w/out overwriting any readers that
    * are already present).
    * @throws InterruptedException 
    */
   private static void copyWritersIntoReaders() throws InterruptedException
   {
      final String me = App.class.getName() + ".copyWritersIntoReaders(): ";
      DatabaseReference dbRef = FirebaseDatabase.getInstance().getReference();
      DatabaseReference clusterData = dbRef.child( "clusterData");
      
      ClusterDataListener listener = new ClusterDataListener( __semaphore);
      clusterData.addListenerForSingleValueEvent( listener);
      __semaphore.acquire(); // Wait for listener to release the semaphore.  This means the data has been read.
      HashMap<String,Object> rewrittenClusterDataMap = new HashMap<>();
      boolean needsRewrite = rewriteClusterDataCopyingWritersToReaders( listener.clusterDataMap, rewrittenClusterDataMap);
      if (needsRewrite)
      {
         clusterData.setValue( rewrittenClusterDataMap, new StandardDbCompletionListener( __semaphore));
         __semaphore.acquire();
      }
      else
         System.out.printf(  "No rewrite required.\n");
   }

   /**
    * Does what {@link #copyWritersIntoReaders()} says it does.
    * @param aClusterDataMap
    * @param aRewrittenClusterDataMap
    * @return
    */
   private static boolean rewriteClusterDataCopyingWritersToReaders( HashMap<String, Object> aClusterDataMap,
         HashMap<String, Object> aRewrittenClusterDataMap)
   {
      boolean retval = false; // Rewrite not needed.
      for (String uid : aClusterDataMap.keySet())
      {
         HashMap<String, Object> singleClusterDataMap = (HashMap<String, Object>) aClusterDataMap.get( uid);
         HashMap<String, Object> writers = (HashMap<String, Object>) singleClusterDataMap.get( "writers");
         HashMap<String, Boolean> readers = (HashMap<String, Boolean>) singleClusterDataMap.get( "readers");
         if (writers == null)
         {
            // Nothing to do; no writers to copy.
            System.err.printf( "Warning: no writers for %s\n", uid);
         }
         else
         {
            if (readers == null)
            {
               readers = new HashMap<>();
               singleClusterDataMap.put( "readers", readers);
            }
            aRewrittenClusterDataMap.put( uid, singleClusterDataMap);
            for (String writerUid : writers.keySet())
            {
               readers.put( writerUid, true);
               retval = true;
            }
         }
      }
      return retval;
   }

   /**
    * Push the clusterData "xml" node down into a "data" node and rename the "owners" node to "editors".
    * @throws InterruptedException 
    */
   private static void pushClusterXmlDownAndRenameClusterOwners() throws InterruptedException
   {
      final String me = App.class.getName() + ".pushClusterXmlDownAndRenameClusterOwners(): ";
      
      DatabaseReference dbRef = FirebaseDatabase.getInstance().getReference();
      DatabaseReference clusterData = dbRef.child( "clusterData");
      
      ClusterDataListener listener = new ClusterDataListener( __semaphore);
      clusterData.addListenerForSingleValueEvent( listener);
      __semaphore.acquire(); // Wait for listener to release the semaphore.  This means the data has been read.
      HashMap<String,Object> rewrittenClusterDataMap = new HashMap<>();
      boolean needsRewrite = rewriteClusterData( listener.clusterDataMap, rewrittenClusterDataMap);
      if (needsRewrite)
      {
         clusterData.setValue( rewrittenClusterDataMap, new DatabaseReference.CompletionListener() {

            @Override
            public void onComplete( DatabaseError aDbError, DatabaseReference aDbRef)
            {
               if (aDbError == null)
                  System.out.printf( "Data saved successfully.\n");
               else
                  System.out.printf( "D/b error: %s - %s\n", aDbError.getCode(), aDbError.getMessage());
               __semaphore.release();
            }
         });
      }
      else
         System.out.printf( "No rewrite needed\n");
      __semaphore.acquire();
   }

   /**
    * Does what {@link #pushClusterXmlDownAndRenameClusterOwners()} says it will do.  Note that only "owners" and "xml"
    * will get handled; everything else will get dropped (but, at the time this is written, that's all there is).
    * @param aClusterDataMap
    * @param aRewrittenClusterDataMap
    * @return
    */
   private static boolean rewriteClusterData( HashMap<String, Object> aClusterDataMap,
         HashMap<String, Object> aRewrittenClusterDataMap)
   {
      boolean retval = false;
      for (String uid : aClusterDataMap.keySet())
      {
         HashMap<String, Object> oldSingleClusterDataMap = (HashMap<String, Object>) aClusterDataMap.get( uid);
         if (oldSingleClusterDataMap.containsKey( "data")
               && oldSingleClusterDataMap.containsKey( "writers"))
         {
            // No change needed; just copy old node into new node.
            aRewrittenClusterDataMap.put( uid, oldSingleClusterDataMap);
         }
         else
         {
            HashMap<String, Object> newSingleClusterDataMap = new HashMap<>();
            String xml = (String) oldSingleClusterDataMap.get( "xml");
            Object owners = oldSingleClusterDataMap.get( "owners");
            HashMap<String, Object> newDataMap = new HashMap<>();
            newDataMap.put( "xml", xml);
            newSingleClusterDataMap.put( "writers", owners);
            newSingleClusterDataMap.put( "data", newDataMap);
            aRewrittenClusterDataMap.put( uid, newSingleClusterDataMap);
            retval = true; // Something got rewritten
         }
      }
      return retval;
   }

   /**
    * Push cluster metadata down into a "metadata" node below the clusters/$uid node.
    * @throws InterruptedException
    */
   private static void transformClusterMetadata() throws InterruptedException
   {
      final String me = App.class.getName() + ".transformClusterMetadata(): ";
      System.out.println( me);
      
      DatabaseReference dbRef = FirebaseDatabase.getInstance().getReference();
      DatabaseReference kids = dbRef.child( "clusters");

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
      __semaphore.acquire(); // Wait for listener to release the semaphore.  This means the data has been read.
      if (__clusterUidToMetadataMap == null)
      {
         // Do nothing
      }
      else
      {
         boolean needsRewrite = rewriteMetadata();
         if (needsRewrite)
         {
            System.out.printf( "New clusters object: %s\n", __rewrittenClusterUidToMetadataMap);
            // Note: using a completion handler seems to be important; otherwise the program seems to end too early
            // and data somehow doesn't get finalized.
            kids.setValue( __rewrittenClusterUidToMetadataMap, new DatabaseReference.CompletionListener() {

               @Override
               public void onComplete( DatabaseError aDbError, DatabaseReference aDbRef)
               {
                  if (aDbError == null)
                     System.out.printf( "Data saved successfully.\n");
                  else
                     System.out.printf( "D/b error: %s - %s\n", aDbError.getCode(), aDbError.getMessage());
                  __semaphore.release();
               }
            });
            __semaphore.acquire( 2); // Wait again for (hopefully) a data change event. Note that we should get TWO
                                     // semaphores: one from a data-change event, and one from the completion handler.
                                     // Note that it's entirely possible that the first event comes from a LOCAL
                                     // in-memory copy of the d/b, and if we exit the program at that point, we may be
                                     // cutting of transmission to the server. Which is why it can look like a
                                     // successful update happened, but nothing happens on the server.
         }
         else
            System.out.printf( "No rewrite needed.\n");
      }
   }

   /**
    * Rewrite cluster metadata in {@link #__clusterUidToMetadataMap} to {@link #__rewrittenClusterUidToMetadataMap},
    * returning true if rewritten data needs to actually be written out (i.e., is NOT a no-op).
    */
   private static boolean rewriteMetadata()
   {
      boolean retval = false;
      for (String uid : __clusterUidToMetadataMap.keySet())
      {
         // Transform "/clusters/uid/<metadata>" to
         // "/clusters/uid/metadata/<metadata>"
         Object metadataObj = __clusterUidToMetadataMap.get( uid);
         System.out.printf( "\t%s\n", uid);
         try
         {
            HashMap<String, Object> metadata = (HashMap<String, Object>) metadataObj;
            HashMap<String,Object> metadataMember = (HashMap<String,Object>) metadata.get( "metadata");
            if (metadataMember == null)
            {
               metadataMember = new HashMap<>();
               retval = true; // We're going to write at least one "metadata" member.
            }
            else
            {
               System.out.printf( "\t\tremove extraneous metadata\n");
               metadata.remove( "metadata");
               // At this point, we have a metadata object in hand from the metadata map, but we still want
               // to remove it to keep from cluttering things up.  We'll copy the rest of the metadata into
               // this metadata object, possibly overwriting what's already there, but that's ok, because
               // we assume the source metadata is more up-to-date than what's being overwritten.
            }
            // There's probably a better way to do this with
            // Streams, but it's more than I want to spend time on
            // right now.
            StringBuffer sb = new StringBuffer();
            for (String key : metadata.keySet())
            {
               sb.append( sb.length() > 0 ? ", " : "").append( key);
               metadataMember.put( key, metadata.get( key));
               retval = true;   // We're going to erase at least one old piece of metadata from its source location.
            }
            System.out.printf( "\t\tmetadataMember has %d total keys, with the following imported from parent cluster: [%s]\n",
                  metadataMember.keySet().size(), sb);
            HashMap<String,Object> newMetadataMap = new HashMap<>();
            newMetadataMap.put("metadata", metadataMember);
            __rewrittenClusterUidToMetadataMap.put( uid, newMetadataMap); // "/clusters/$uid/metadata" --> metadataMember
         }
         catch (Exception exc)
         {
            System.out.printf( "\t\tException: %s\n", exc.toString());
            retval = false; // State unknown -- don't write anything out.
         }
      }
      return retval;
   }

}
