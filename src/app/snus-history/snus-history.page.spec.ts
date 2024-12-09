import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnusHistoryPage } from './snus-history.page';

describe('SnusHistoryPage', () => {
  let component: SnusHistoryPage;
  let fixture: ComponentFixture<SnusHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SnusHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
