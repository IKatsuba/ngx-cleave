import { async, TestBed } from '@angular/core/testing';
import { NgxCleaveModule } from './ngx-cleave.module';

describe('NgxCleaveModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NgxCleaveModule]
    }).compileComponents();
  }));

  it('should create', () => {
    expect(NgxCleaveModule).toBeDefined();
  });
});
