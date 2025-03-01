import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from "@angular/common";

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  standalone: true,
  imports: [
    NgIf
  ],
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  bookId: string | null = null;
  bookDetails: any; // Defina um tipo mais específico se possível
  responseMessage: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
  }

  // ngOnInit(): void {
  //   this.bookId = this.route.snapshot.paramMap.get('id');
  //   if (this.bookId) {
  //     this.fetchBookDetails(this.bookId);
  //   } else {
  //     console.error('ID do livro não encontrado na rota.');
  //   }
  // }



}
