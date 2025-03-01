import { Component, Input, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeyValuePipe, NgForOf, NgIf } from "@angular/common";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-animated-stacked-pages',
  standalone: true,
  imports: [NgIf],
  templateUrl: './animated-stacked-pages.component.html',
  styleUrls: ['./animated-stacked-pages.component.css']
})
export class AnimatedStackedPagesComponent implements OnInit {
  @Input() book: any; // Recebe o livro selecionado
  @Output() close = new EventEmitter<void>();
  activeIndex = 0; // Índice da página atual
  pages: { key: number, value: string }[] = []; // Armazena as páginas do livro
  showInstructions = true; // Exibe a mensagem no início
  showSynopsis = false; // Estado para mostrar a sinopse ou a leitura



  constructor(private http: HttpClient) {}

  ngOnInit() {

    console.log("📖 Modal de leitura inicializado para:", this.book);

    if (!this.book) {
      console.error("❌ ERRO: Nenhum livro recebido no modal!");
      return;
    }

    console.log("📘 Dados recebidos pelo modal:", this.book);
    this.setupPages();

    if (this.book) {
      this.fetchBookSections(this.book.title);
    }

    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
      this.showInstructions = false;
    }, 5000);
  }

  fetchBookSections(title: string) {
    this.http.get<any>(`${environment.mainUrl}/livro/${title}`).subscribe(
      (data) => {
        this.book = data; // Recebe os dados do livro
        this.setupPages(); // Configura as páginas do livro com base nos dados retornados
        console.log('Dados retornados:', data);
      },
      (error) => {
        console.error('Erro ao buscar os dados do livro:', error);
      }
    );
  }

  setupPages() {
    if (!this.book) return;

    console.log("📖 Configurando páginas para:", this.book.title);

    if (this.book.page) {
      this.pages = Object.keys(this.book.page).map(key => ({
        key: +key, // Converte a chave numérica para número
        value: this.book.page[key]
      }));
    }

    console.log("✅ Páginas configuradas:", this.pages);
  }

  formatText(text: unknown): string {
    if (typeof text !== 'string') return '';

    return text
      .replace(/\n/g, '<br/>')  // Mantém quebras de linha
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Converte **texto** em <b>texto</b>
  }


  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.showSynopsis) { // Evita que mude de página quando estiver na sinopse
      if (event.key === 'ArrowRight') {
        this.nextPage();
      } else if (event.key === 'ArrowLeft') {
        this.previousPage();
      }
    }
  }

  nextPage() {
    if (this.activeIndex < this.pages.length - 1) {
      this.activeIndex++;
    }
  }

  previousPage() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  reset() {
    this.activeIndex = 0; // Reseta para a primeira página
  }

  closeModal() {
    this.close.emit(); // Emite evento de fechamento
  }

  formatTitle(title?: string): string {
    return title ? title.replace(/_/g, ' ') : ''; // Retorna uma string vazia se `title` for undefined
  }

  // Impede que o modal feche ao clicar fora
  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  toggleSynopsis() {
    this.showSynopsis = !this.showSynopsis;
  }
}
