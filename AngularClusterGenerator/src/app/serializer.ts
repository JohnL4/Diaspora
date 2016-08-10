/**
 * Interface assumes object to be serialized/deserialized is held by another reference in the class implementing this
 * interface, not as inputs or return values for any of the given functions.
 */  
export interface Serializer
{
   /**
    * Generate a string representing the object to be serialized.
    */
   serialize(): string;

   /**
    * Read the given string, generating a corresponding object.
    */
   deserialize( aString: string);
}
