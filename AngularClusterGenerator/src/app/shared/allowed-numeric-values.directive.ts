import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidatorFn, Validators } from '@angular/forms';

let anv_me = "allowed-numeric-values.directive.ts";

console.log( anv_me + ": loading");

const SELECTOR: string = 'allowedNumericValues'; // TODO: figure out if this is in some namespace or if it's going to
                                                 // collide with some other module's SELECTOR.

class Range
{
   /**
    * "exclusive" booleans <==> corresponding endpoint is exclusive. Default is obviously non-exclusive (i.e., inclusive).
    */
   constructor ( public Low: number, public High: number, public LowExclusive: boolean, public HighExclusive: boolean)
   {
      if (Low > High) throw new Error( `Illegal range, Low (${Low}) > High (${High})`);
   }
}

/**
 * Validate numbers given an "allowed-values specification" in the form "i;j;[k,m];(n,p);[,q);[r,]".
 * Return of validator call is null if valid or object in following form:
 *
 * <pre>
 *    { allowedNumericValues:    // Note that this property is the value of SELECTOR, defined above.
 *       { valueInError: (the original user input),
 *         allowedValues: (the original allowed-values specification)
 *       }
 *    }
 * </pre>
 *
 * Allowed-values spec above means the following values are allowed:
 *
 * <ul>
 *    <li> i
 *    <li> j
 *    <li> All values (including floating point) in the range [k,m] (inclusive) -- k must be less than or equal to m
 *    <li> All values in the range (n,p) (exclusive) -- same restriction on n, p as above
 *    <li> All values less than q
 *    <li> All values greater than or equal to r
 * </ul>
 *
 * Note the inclusivity and exclusivity on endpoints can be mixed, as in [0.0,100.0).  All ranges must have a comma and
 * at least one endpoint.  Note also that this validator will allow floating point values; consider using regular
 * expression validation to force integers if you need that.
 */
export function allowedNumericValuesValidator( anAllowedValuesSpec: string): ValidatorFn
{
   console.log( anv_me + ": running allowedNumericValuesValidator()");
   let errors: string[] = [];   // Errors from parsing allowed-values specification
   let ranges : Range[] = [];   // Allowed ranges, used in validation.
   let rangeSpecs = anAllowedValuesSpec.split( /\s*;\s*/);
   for (let r of rangeSpecs)
   {
      let ends : string[] = r.split( /\s*,\s*/);
      try
      {
         if (ends.length == 1)
         {
            // Plain number, not a range
            let end : number = Number(ends[0]);
            if (isNaN( end))
               errors.push( "NaN: " + r);
            else
               ranges.push( new Range( end, end, false, false));
         }
         else if (ends.length == 2)
         {
            // Leading, trailing whitespace should have already been stripped by split() calls.
            // range opener plus low endpoint, modulo whitespace.
            // TODO: unit-test these regexps.
            let lowMatches = ends[0].match( /^([[(])(.*)/); // $2 may be empty (whitespace only)
            let highMatches = ends[1].match( /([^\])]*)([\])])/); // $1 may be empty (whitespace only)
            if (! lowMatches || ! highMatches)
               errors.push( "Bad range syntax: " + r);
            else
            {
               let low = toNum( lowMatches[2], -Infinity);
               let high = toNum( highMatches[1], +Infinity);
               let lowExcl: boolean = lowMatches[1].match( /\(/) ? true : false;
               let highExcl: boolean = highMatches[2].match( /\)/) ? true : false;
               ranges.push( new Range( low, high, lowExcl, highExcl));
            }
         }
         else
            // Too many commas or something.
            errors.push( "Bad range syntax: " + r);
      }
      catch (exc)
      {
         errors.push( exc.toString());
      }
   }
   if (errors.length > 0)
      throw new Error( errors.join( "; "));

   return (control: AbstractControl): {[key: string]: any} => {
      console.log( anv_me + ": running anon. validator fn");
      const numberToBeValidated = control.value;
      const num = Number( numberToBeValidated);
      if (isNaN( num))
         return errorReturnValue( numberToBeValidated, anAllowedValuesSpec);
      let isGood: boolean = false;
      for (let r of ranges)
      {
         if (((r.LowExclusive && r.Low < num) || (! r.LowExclusive && r.Low <= num))
             && ((r.HighExclusive && num < r.High) || (! r.HighExclusive && num <= r.High)))
         {
            isGood = true;
            break;
         }
      }
      // Not using ternary expression so I can breakpoint on the else clause
      let retval;
      if (isGood)
         retval = null;
      else
         retval = errorReturnValue( numberToBeValidated, anAllowedValuesSpec);
      return retval;
   };
}

function errorReturnValue( aValue: any, anAllowedValuesSpec: string): Object
{
   // [SELECTOR]: ES6 computed property name
   return {[SELECTOR]: {valueInError: aValue, allowedValues: anAllowedValuesSpec}};
}

/**
 * Convert string to number, with default for whitespace, throwing exception on NaN.
 */
function toNum( aString: string, aDefault: number): number
{
   let num;
   if (aString.match( /^\s*$/))
      num = aDefault;
   else
   {
      num = Number( aString);
      if (isNaN( num))
         throw new Error( `isNan: ${aString}`);
   }
   return num;
}

@Directive({
   selector: '[' + SELECTOR + ']',
   providers: [{provide: NG_VALIDATORS, useExisting: AllowedNumericValuesDirective, multi: true}]
})
export class AllowedNumericValuesDirective implements Validator, OnChanges
{
   @Input() allowedNumericValues: string;
   private valFn = Validators.nullValidator;

   ngOnChanges( changes: SimpleChanges): void
   {
      console.log( anv_me + ": ngOnChanges()");
      const change = changes[ SELECTOR];
      if (change)
      {
         const val: string = change.currentValue;
         this.valFn = allowedNumericValuesValidator( val);
      }
      else
         this.valFn = Validators.nullValidator;
   }

   validate( control: AbstractControl): {[key: string]: any}
   {
      console.log( anv_me + ": validate");
      return this.valFn( control);
   }
}
