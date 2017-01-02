import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewChild, Renderer, ElementRef } from '@angular/core';
import { FormsModule, NgForm, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

import { Cluster } from '../cluster';

@Component({
  selector: 'app-generator-params',
  templateUrl: './generator-params.component.html',
  styleUrls: ['./generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit, AfterViewInit, AfterViewChecked {

   private numSystems: string; // = "6";
//   get numSystems() : string { return this._numSystems; }
//   set numSystems( value: string) { this._numSystems = value; }
   
   validationMessages = {
      'numSystems': {
         'required': "A number of systems is required",
         'allowedNumericValues': "Value must be one of the allowed numeric values",
         'pattern': "Value must be an integer"
      }
   };
   
   formErrors = {
      'numSystems': ''
   };

   parmsForm: NgForm;
   @ViewChild( 'parmsForm') currentForm: NgForm;
   @ViewChild( 'numSystemsInput') numSystemsInput: ElementRef;
   
   private _cluster: Cluster;
   private _router: Router;
   public highLowHelpShowing: boolean = false;
   
   constructor(aCluster: Cluster, aRouter: Router, private _renderer: Renderer)
   {
      this._cluster = aCluster;
      this._router = aRouter;
      if (aCluster && aCluster.numSystems)
         this.numSystems = aCluster.numSystems.toString();
      // this.strSystems = this.numSystems.toString();
      // this.numSystems = "6"; // aCluster.numSystems.toString();
   }

   ngOnInit()
   {
   }

   ngAfterViewInit()
   {
      console.log( "ngAfterViewInit()");
      // This is the safe way to invoke DOM element methods.
      // See http://angularjs.blogspot.com/2016/04/5-rookie-mistakes-to-avoid-with-angular.html
      this._renderer.invokeElementMethod( this.numSystemsInput.nativeElement, 'focus');
   }
   
   /** See form validation cookbook "recipe"
    */
   ngAfterViewChecked()
   {
      this.formChanged();
   }

   public generateCluster()
   {
      console.log( "generateCluster()");
      // this._cluster = new Cluster( this.numSystems); // Don't new up, just update in place?
      this._cluster.numSystems = Number( this.numSystems);
      // this.cluster.generateSystems();
   }

   public revertParams()
   {
      console.log( "revertParams()");
      this.numSystems = this._cluster
         && this._cluster.numSystems
         && this._cluster.numSystems.toString()
         || "";
   }

   onSubmit()
   {
      console.log( "onSubmit()");
      // Note: If we were submitting form contents to a server for generation on the server side, I think I'd not do a
      // local navigation, but would instead wait for the server's response.  Maybe.  Need to make sure server updates
      // browser nav history properly so deep-linking works.  Don't know how to do that yet.
      this.gotoDetails();
   }

   gotoDetails()
   {
      this._router.navigate(['/details']);
   }

   showHighLowHelp()
   {
      console.log( "showHighLowHelp()");
      this.highLowHelpShowing = ! this.highLowHelpShowing;
      return false;
   }
   
   /**
    * Returns true if the given control (by name) has a required value missing (i.e., 'required' validator has failed).
    * Also returns true if given control name isn't found.
    */
   isRequiredValueMissing( aFieldName: string): boolean
   {
      let retval: boolean;
      const control = this.parmsForm
         && this.parmsForm.form
         && this.parmsForm.form.get( aFieldName)
         || null;
      if (control)
      {
         if (control.errors && control.errors['required'])
            retval = true;
         else
            retval = false;
      }
      else
      {
         console.log( `Warning: unable to determine whether control "${aFieldName}" has a required value missing`);
         retval = true;
      }
      return retval;
   }

   formChanged()
   {
      if (this.currentForm === this.parmsForm) return;
      this.parmsForm = this.currentForm;
      if (this.parmsForm)
         this.parmsForm.valueChanges.subscribe( data => this.onValueChanged( data));
   }

   onValueChanged( data?: any)
   {
      if (!this.parmsForm) return;
      const form = this.parmsForm.form;

      for (const field in this.formErrors)
      {
         this.formErrors[field] = '';
         const control = form.get( field);
         if (control && control.dirty && !control.valid)
         {
            const messages = this.validationMessages[field];
            for (const failedValidator in control.errors) // Note: 'in' operator iterates over object property names.
            {
               switch (failedValidator)
               {
               case "allowedNumericValues":
                  this.formErrors[field] += `${messages[failedValidator]} (${control.errors[failedValidator].allowedValues}); `;
                  break;
               // case "pattern":
               //    this.formErrors[field] += `${messages[failedValidator]} (${control.errors[failedValidator].requiredPattern}); `;
               //    break;
               default:
                  this.formErrors[field] += messages[failedValidator] + '; ';
                  break;
               }
            }
         }
      }
   }   
}
