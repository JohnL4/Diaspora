package com.how_hard_can_it_be.FirebaseAdmin;

import java.io.FileInputStream;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseCredentials;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {       
        try
        {
        FileInputStream serviceAccount = new FileInputStream(
                "diaspora-dev-firebase-adminsdk-voul2-9fc9e89711.json");

        FirebaseOptions options = new FirebaseOptions.Builder()
          .setCredential(FirebaseCredentials.fromCertificate(serviceAccount))
          .setDatabaseUrl("https://diaspora-dev.firebaseio.com/")
          .build();

        FirebaseApp.initializeApp(options);
        }
        catch (Exception exc)
        {
            System.err.println( "Error: " + exc.toString());
        }
        System.out.println( "(Firebase admin done.)");
    }
}
