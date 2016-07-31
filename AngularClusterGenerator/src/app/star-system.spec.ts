/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import {StarSystem} from './star-system';

describe('StarSystem', () => {
  it('should create an instance', () => {
     expect(new StarSystem("", 0, 0, 0)).toBeTruthy();
  });
});
