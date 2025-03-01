import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimatedStackedPagesComponent } from './animated-stacked-pages.component';

describe('AnimatedStackedPagesComponent', () => {
  let component: AnimatedStackedPagesComponent;
  let fixture: ComponentFixture<AnimatedStackedPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimatedStackedPagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimatedStackedPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
