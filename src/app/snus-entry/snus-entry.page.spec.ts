import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnusEntryPage } from './snus-entry.page';

describe('SnusEntryPage', () => {
  let component: SnusEntryPage;
  let fixture: ComponentFixture<SnusEntryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SnusEntryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
