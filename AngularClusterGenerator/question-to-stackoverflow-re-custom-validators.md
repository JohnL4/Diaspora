Having trouble get an Angular 2 custom validator working using the
approach from the cookbook.

My primary goal is to learn Angular (which is to say, I'm a noob, as
always).

I'm trying to have a text input field that only allows integers in a
certain range (1-26).  I thought I'd get clever and write a validator
that takes an arbitrary list of numbers and ranges (e.g.,
"1,3,5,7,11-19,100-200"), and checks to see that the given value is
one of the allowed values.

My problem is that the custom validator (the anonymous function
returned by `allowedNumericValuesValidator`?) is never being called.
(But note that the built `required` validator runs just fine.)  For
that matter, nor are any of the methods defined in
`AllowedNumericValuesDirective` being called.  The validator source
code itself gets loaded, but that's as far as things go.

Using Angular 2.2.3, angular-cli 1.0.0-beta.22-1.
Browser is Chrome 55.0.2883.95 (64-bit)

Source is at https://github.com/JohnL4/Diaspora, but I'll try to put
the relevant parts here.

Here's what I've done:

My validator looks like this:

<!-- language: typescript -->

    import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
    import { AbstractControl, NG_VALIDATORS, Validator, ValidatorFn, Validators } from '@angular/forms';

    const SELECTOR: string = 'allowedNumericValues'; // <---------------- breakpoint here

    class Range
    {
       constructor ( public Low: number, public High: number) {}
    }

    export function allowedNumericValuesValidator( anAllowedValuesSpec: string): ValidatorFn
    {
       let errors: string[] = [];   // (<---- breakpoint here) Errors from parsing allowed values specification
       let ranges : Range[] = [];   // Allowed ranges, used in validation.
       let rangeSpecs = anAllowedValuesSpec.split( /\s*,\s*/);
       for (let r of rangeSpecs)
       {
          let ends : string[] = r.split( /\s*-\s*/);
          if (ends.length == 1)
          {
             let end : number = Number(ends[0]);
             if (isNaN( end))
                errors.push( r + " is NaN");
             else
                ranges.push( new Range( end, end));
          }
          else if (ends.length == 2)
          {
             let low:number = Number(ends[0]);
             let high:number = Number(ends[1]);
             if (isNaN( low) || isNaN( high))
                errors.push( r + " has NaN");
             else
                ranges.push( new Range( low, high));
          }
          else
             errors.push( r + " has bad syntax");
       }
       if (errors.length > 0)
          throw new Error( errors.join( "; "));

       return (control: AbstractControl): {[key: string]: any} => {
          const numberToBeValidated = control.value; // <---------------- breakpoint here
          const num = Number( numberToBeValidated);
          if (isNaN( num))
             return {SELECTOR: {numberToBeValidated}};
          let isGood: boolean = false;
          for (let r of ranges)
          {
             if (r.Low <= num && num <= r.High)
             {
                isGood = true;
                break;
             }
          }
          return isGood ? null : {SELECTOR: {numberToBeValidated}};
       };
    }

    @Directive({
       selector: '[' + SELECTOR + ']', // Note: not using extra '[ngForm]' or '[ngModel]' here because the cookbook example doesn't.
       providers: [{provide: NG_VALIDATORS, useExisting: AllowedNumericValuesDirective, multi: true}]
    })
    export class AllowedNumericValuesDirective implements Validator, OnChanges
    {
       @Input() allowedNumericValues: string;
       private valFn = Validators.nullValidator; // <---------------- breakpoint here

       ngOnChanges( changes: SimpleChanges): void
       {
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
          return this.valFn( control);
       }
    }

If I put a breakpoint on the `const SELECTOR` assignment, it gets hit
(callstack is about half a dozen `__webpack_require__` calls), but
nothing gets called after that (none of the other breakpoints get hit,
nor do any `console.log()` statements I put in get called.

My `shared.module.ts`, in the same `shared` directory as the
validator, looks like this:

<!-- language: typescript -->

    import { NgModule } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { SharedComponent } from './shared.component'; // angular-cli stuck this in here; I'm not sure I need it.
    import { AllowedNumericValuesDirective } from './allowed-numeric-values.directive';

    @NgModule({
      imports: [
        CommonModule
      ],
      declarations: [SharedComponent, AllowedNumericValuesDirective]
    })
    export class SharedModule { }

My `app.module.ts` looks like this (I have 4 components, but I'm only
concerned with the "params" one and the other three are working fine):

<!-- language: typescript -->

    import { BrowserModule } from '@angular/platform-browser';
    import { NgModule } from '@angular/core';
    import { FormsModule } from '@angular/forms';
    import { HttpModule } from '@angular/http';
    import { RouterModule }   from '@angular/router';

    import { SharedModule } from './shared/shared.module'; 
    import { AppComponent } from './app.component';
    import { ClusterDetailsComponent } from './cluster-details/cluster-details.component';
    import { DotComponent } from './dot/dot.component';
    import { GeneratorParamsComponent } from './generator-params/generator-params.component';
    import { TabsComponent } from './tabs/tabs.component';
    import { XmlComponent } from './xml/xml.component';

    @NgModule({
       declarations: [
          AppComponent,
          ClusterDetailsComponent,
          DotComponent,
          GeneratorParamsComponent,
          TabsComponent,
          XmlComponent
       ],
       imports: [
          BrowserModule,
          FormsModule,
          HttpModule,
          SharedModule, // I don't need to put the validator in the `declarations` property above, do I?
          RouterModule.forRoot([
             {
                path: '',           // Initial load.
                redirectTo: '/params',
                pathMatch: 'full'
             },
             {
                path: 'params',
                component: GeneratorParamsComponent
             },
             {
                path: 'details',
                component: ClusterDetailsComponent
             },
             {
                path: 'xml',
                component: XmlComponent
             },
             {
                path: 'dot',
                component: DotComponent
             }
          ])
       ],
       providers: [],
       bootstrap: [AppComponent]
    })
    export class AppModule { }

`generator-params.component.html` looks like this:

<!-- language: lang-html -->

    <p></p>

    <form #parmsForm="ngForm" class="form-horizontal">  <!-- "form-horizontal" is Bootstrap class -->
      <div class="form-group">                           <!-- "form-group" is Bootstrap class -->
        <label for="numSystems" class="col-sm-3 control-label"> <!-- "control-label" is the class for labels in HORIZONTAL forms. -->
          Number of systems in cluster
        </label>
        <div class="col-sm-2">
          <input id="numSystems" name="numSystems" type="text" class="form-control"
                 required maxlength="2" allowedNumericValues="1-26"
                 [(ngModel)]="numSystems">
        </div>
        <div *ngIf="formErrors.numSystems" class="col-sm-6 alert alert-danger">
          {{ formErrors.numSystems }}
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-3 col-sm-9">
          <div class="checkbox">    <!-- "checkbox" is Bootstrap class -->
            <label for="slipstreamsHighLow">
              <input id="slipstreamsHighLow" name="slipstreamsHighLow" type="checkbox" />
              Slipstreams Differentiated Between High & Low Slipknots
            </label>
          </div>
      </div></div>
      <div class="form-group">
        <div class="col-sm-offset-3 col-sm-9">
        <button id="goBtn" (click)="generateCluster()" class="btn btn-default btn-warning"
                title="Obviously, this will hammer your existing cluster. Be sure you have it backed up or otherwise saved, or that you don't care."
                >
          Go!
        </button>
        <button id="revertBtn" class="btn btn-default" (click)="revertParams()">Revert</button>
        </div>
      </div>
    </form>

And finally, `generator-params.component.ts` looks like this:

<!-- language: typescript -->

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

I *think* I've hooked everything up correctly per the cookbook, but
clearly I've missed something, because the custom validator isn't
firing.

Can anyone tell me what I missed?

Thanks.
