/* tslint:disable:no-unused-variable */

import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { addProviders, async, inject } from '@angular/core/testing';
import { GeneratorParamsComponent } from './generator-params.component';
import { Cluster } from '../cluster';

describe('Component: GeneratorParams', () => {
  it('should create an instance', () => {
     let component = new GeneratorParamsComponent(new Cluster());
    expect(component).toBeTruthy();
  });
});