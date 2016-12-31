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
