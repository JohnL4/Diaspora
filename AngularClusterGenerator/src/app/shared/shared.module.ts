import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedComponent } from './shared.component';
import { AllowedNumericValuesDirective } from './allowed-numeric-values.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SharedComponent, AllowedNumericValuesDirective]
})
export class SharedModule { }
