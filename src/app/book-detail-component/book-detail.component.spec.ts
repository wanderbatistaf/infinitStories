import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookDetailComponentComponent } from './book-detail.component';

describe('BookDetailComponentComponent', () => {
  let component: BookDetailComponentComponent;
  let fixture: ComponentFixture<BookDetailComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookDetailComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookDetailComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
