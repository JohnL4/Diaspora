/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ClusterPersistenceService } from './cluster-persistence.service';

describe('ClusterPersistenceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterPersistenceService]
    });
  });

  it('should ...', inject([ClusterPersistenceService], (service: ClusterPersistenceService) => {
    expect(service).toBeTruthy();
  }));
});
