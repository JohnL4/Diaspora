/* tslint:disable:no-unused-variable */

import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { addProviders, async, inject } from '@angular/core/testing';
import { DotComponent } from './dot.component';

describe('Component: Dot', () => {
  it('should create an instance', () => {
    let component = new DotComponent();
    expect(component).toBeTruthy();
  });
});
