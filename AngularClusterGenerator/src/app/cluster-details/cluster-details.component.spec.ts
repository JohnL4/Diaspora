/* tslint:disable:no-unused-variable */

import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { addProviders, async, inject } from '@angular/core/testing';
import { ClusterDetailsComponent } from './cluster-details.component';
import { Cluster } from '../cluster';

describe('Component: ClusterDetails', () => {
  it('should create an instance', () => {
     let component = new ClusterDetailsComponent( new Cluster());
    expect(component).toBeTruthy();
  });
});
