import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookShelfComponentComponent } from './book-shelf-component.component';

describe('BookShelfComponentComponent', () => {
  let component: BookShelfComponentComponent;
  let fixture: ComponentFixture<BookShelfComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookShelfComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookShelfComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
