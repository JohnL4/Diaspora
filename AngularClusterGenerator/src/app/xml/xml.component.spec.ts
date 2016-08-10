/* tslint:disable:no-unused-variable */

import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { addProviders, async, inject } from '@angular/core/testing';
import { XmlComponent } from './xml.component';
import { Cluster } from '../cluster';

describe('Component: Xml', () => {
  it('should create an instance', () => {
     let component = new XmlComponent( new Cluster());
    expect(component).toBeTruthy();
  });
});
