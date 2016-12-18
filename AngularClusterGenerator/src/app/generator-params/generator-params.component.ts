import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { Cluster } from '../cluster';

@Component({
  selector: 'app-generator-params',
  templateUrl: './generator-params.component.html',
  styleUrls: ['./generator-params.component.css']
})
export class GeneratorParamsComponent implements OnInit {

   private numSystems: string; // = "6";
//   get numSystems() : string { return this._numSystems; }
//   set numSystems( value: string) { this._numSystems = value; }
   
   parmsForm: NgForm;
   @ViewChild( 'parmsForm') currentForm: NgForm;
   
   formErrors = {
      'numSystems': ''
   };

   validationMessages = {
      'numSystems': {
         'required': "A number of systems is required",
         'allowedNumericValues': "Value must be one of the allowed numeric values"
      }
   };
   
   private _cluster: Cluster;
   
   constructor(aCluster: Cluster)
   {
      this._cluster = aCluster;
      if (aCluster && aCluster.numSystems)
         this.numSystems = aCluster.numSystems.toString();
      // this.strSystems = this.numSystems.toString();
      // this.numSystems = "6"; // aCluster.numSystems.toString();
   }

   ngOnInit()
   {
   }

   /** See form validation cookbook "recipe"
    */
   ngAfterViewChecked()
   {
      this.formChanged();
   }

   public generateCluster()
   {
      // this._cluster = new Cluster( this.numSystems); // Don't new up, just update in place?
      this._cluster.numSystems = Number( this.numSystems);
      // this.cluster.generateSystems();
   }

   public revertParams()
   {
      this.numSystems = this._cluster.numSystems.toString();
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
            for (const key in control.errors)
            {
               this.formErrors[field] += messages[key] + ' ';
            }
         }
      }
   }
}
