import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewChild, Renderer, ElementRef } from '@angular/core';
import { FormsModule, NgForm, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

import { Cluster } from '../cluster';
import { PersistenceService } from '../persistence.service';
import { ClusterSerializerXML } from '../cluster-serializer-xml';
import { uniqueClusterName } from '../utils';

@Component({
  selector: 'app-generator-params',
  templateUrl: './generator-params.component.html',
  styleUrls: ['./generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit, AfterViewInit, AfterViewChecked {

   validationMessages = {
      'numSystems': {
         'required': "A number of systems is required",
         'allowedNumericValues': 'Value must be one of the allowed numeric values',
         'pattern': "Value must be an integer"
      }
   };
   
   formErrors = {
      'numSystems': ''
   };

   /** User's input, not necessarily valid. */
   private numSystems: string; // = "6";
   
   private _useHighLowSlipstreams: boolean;

   private _serializer: ClusterSerializerXML;

   // TODO: Should the following be private or something?
   parmsForm: NgForm;
   @ViewChild( 'parmsForm') currentForm: NgForm;
   @ViewChild( 'numSystemsInput') numSystemsInput: ElementRef;
   
   private get cluster(): Cluster { return this._persistenceSvc.currentCluster; }
   
   private _router: Router;
   private _highLowHelpShowing = false;
   
   private get clusterMetadata() { return this._persistenceSvc.clusterMetadata; }

   /**
    * The name of the cluster that has been requested by some user gesture (either generate a new cluster, in which case
    * there will be no requested name, or load a named cluster, in which case....)
    */
   private _requestedClusterName: string;

   // ------------------------------------------------  Public Methods  ------------------------------------------------
   
   constructor( /* aCluster: Cluster, */ aRouter: Router, private _renderer: Renderer, private _persistenceSvc: PersistenceService)
   {
      // this._cluster = aCluster;
      // this.cluster = this._persistenceSvc.currentCluster;
      this._router = aRouter;
      if (this.cluster)
      {
         this._useHighLowSlipstreams = this.cluster && this.cluster.usesHighLowSlipstreams;
         if (this.cluster.numSystems)
            this.numSystems = this.cluster.numSystems.toString();
      }
   }

   ngOnInit()
   {
   }

   ngAfterViewInit()
   {
      // console.log( "ngAfterViewInit()");
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
      // console.log( "generateCluster()");
      if (this.parmsForm.form.valid)
      {
         this._requestedClusterName = null;
         
         // Note that we don't simply new up a new Cluster, because the injector is managing the one we were passed.
         // Instead, we modify the existing one in place.  (NOTE: now that we've gotten rid of the injected Cluster, we
         // don't have to do it this way.)
         this.cluster.generate( Number( this.numSystems), this._useHighLowSlipstreams);

         if (localStorage)
         {
            if (! this._serializer)
               this._serializer = new ClusterSerializerXML();
            this._serializer.cluster = this.cluster;
            const clusterXml = this._serializer.serialize();
            console.log( `generateCluster(): before setting, localStorage has ${localStorage.length} items`);
            localStorage.setItem( 'cluster', clusterXml);
            console.log( `generateCluster(): after setting, localStorage has ${localStorage.length} items`);
            for (const key in localStorage)
               console.log( `\tkey: ${key}`);
         }
      }
      else
         console.log( 'form invalid; not generating cluster');
      // alert( "generateCluster() done");
   }

   public loadCluster( aCluster: Cluster): void
   {
      const me = this.constructor.name + '.loadCluster(): ';
      console.log( me + `cluster = ${aCluster.toString()} (constructor = ${aCluster.constructor.name})`);
      const uniqueName = aCluster.uniqueName();
      console.log( me + `cluster unique name (encoded) = >${encodeURIComponent( uniqueName)}<`);
      this._persistenceSvc.loadCluster( aCluster.uniqueName()); // TODO: probably better to just do this in the details
                                                                // screen, which will help w/the deep linking.
      this._requestedClusterName = uniqueName;
   }
   
   public deleteCluster( aCluster: Cluster): void
   {
      const me = this.constructor.name + '.deleteCluster(): ';
      const uniqueName = aCluster.uniqueName();
      this._persistenceSvc.deleteCluster( uniqueName);
   }
   
   public revertParams()
   {
      // console.log( "revertParams()");
      this.numSystems = this.cluster
         && this.cluster.numSystems
         && this.cluster.numSystems.toString()
         || '';
      this._useHighLowSlipstreams = this.cluster && this.cluster.usesHighLowSlipstreams;
   }

   onSubmit()
   {
      // console.log( "onSubmit()");
      // Note: If we were submitting form contents to a server for generation on the server side, I think I'd not do a
      // local navigation, but would instead wait for the server's response.  Maybe.  Need to make sure server updates
      // browser nav history properly so deep-linking works.  Don't know how to do that yet.
      this.gotoDetails();
   }

   gotoDetails()
   {
      const me = this.constructor.name + '.gotoDetails(): ';
      let uniqueName: string;
      // Note: loading is happening asynchronously, so it doesn't do any good to ask the cluster its name; it probably
      // hasn't been loaded yet.
      // if (this.cluster.name)
      if (this._requestedClusterName)
         uniqueName = this._requestedClusterName;
      else
      {
         console.log( me + 'Cluster has no name, therefore, no unique name.');
         uniqueName = null;
      }
      if (uniqueName)
         this._router.navigate([`/details/${uniqueName}`]);
      else
         this._router.navigate(['/details']);
   }

   showHighLowHelp()
   {
      // console.log( "showHighLowHelp()");
      this._highLowHelpShowing = ! this._highLowHelpShowing;
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
               case 'allowedNumericValues':
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
