import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoemaComponent } from './poema.component';

describe('PoemaComponent', () => {
  let component: PoemaComponent;
  let fixture: ComponentFixture<PoemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoemaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
