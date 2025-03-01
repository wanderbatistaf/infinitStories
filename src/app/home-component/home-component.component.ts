import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {FooterComponentComponent} from "../footer-component/footer-component.component";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {BookService} from "../_services/book.service";
import {AnimatedStackedPagesComponent} from "../animated-stacked-pages/animated-stacked-pages.component";
import {HttpClient} from '@angular/common/http';
import {environment} from "../../environments/environment";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home-component',
  imports: [
    FooterComponentComponent,
    NgIf,
    NgForOf,
    AnimatedStackedPagesComponent,
    NgStyle,
    FormsModule
  ],
  templateUrl: './home-component.component.html',
  standalone: true,
  styleUrl: './home-component.component.css',
  // styleUrl: '../../styles.css'
})

export class HomeComponentComponent implements AfterViewInit {
  books: any[] = []; // Array para armazenar todos os livros
  allBooks: any[] = []; // Array para armazenar todos os livros e poemas
  selectedBook: any = null; // Para armazenar o livro selecionado
  currentIndex: number = 0;
  booksPerPage = 3;
  genres: string[] = [];
  selectedGenre = 'Todos';
  mainUrl = environment.mainUrl;
  filteredBooks: any[] = [];
  searchQuery: string = '';
  loginUrl: string = `${this.mainUrl}/login`;

  @ViewChild('carousel', { static: false }) carouselElement: ElementRef | undefined;

  constructor(private bookService: BookService, private http: HttpClient, private router: Router) {}

  // ngOnInit(): void {
  //   this.loadBooks(); // Carrega os livros ao inicializar
  // }

  ngAfterViewInit() {
    // Após o conteúdo ser carregado, inicialize o Flickity
    this.loadBooks();
    console.log("📌 Índice inicial:", this.currentIndex);
  }

  goToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex = Math.max(0, this.currentIndex - this.booksPerPage);
      console.log('⬅️ Índice atualizado:', this.currentIndex);
    } else {
      console.log('⛔ Tentativa de voltar além do limite. Índice:', this.currentIndex);
    }
  }

  goToNext() {
    if (this.currentIndex + this.booksPerPage < this.books.length) {
      this.currentIndex = Math.min(this.books.length - this.booksPerPage, this.currentIndex + this.booksPerPage);
      console.log('➡️ Índice atualizado:', this.currentIndex);
    } else {
      console.log('⛔ Tentativa de avançar além do limite. Índice:', this.currentIndex);
    }
  }

  goToLogin() {
    this.router.navigate([this.loginUrl]); // Navega para a URL interna de login
  }

  // loadBooks() {
  //   console.log('Carregando livros...'); // Log para quando começa a carregar os livros
  //   this.bookService.getBooks().subscribe(
  //     (data) => {
  //       // Filtra os livros para remover os que estão na pasta 'poemas'
  //       this.books = data.filter(book => book.folder !== 'poemas');
  //       this.allBooks = data;
  //       console.log('Livros recebidos:', this.books); // Log dos dados recebidos
  //     },
  //     (error) => {
  //       console.error('Erro ao carregar livros:', error); // Log de erro
  //     }
  //   );
  // }

  loadBooks() {
    console.log('Carregando livros...');

    this.bookService.getBooks().subscribe(
      (data) => {
        this.books = [];
        const bookRequests = data
          .filter(book => book.folder !== 'poemas') // Mantém apenas os livros normais
          .map(book =>
            this.http.get<any>(`${environment.mainUrl}/_books/${book.title}/${book.title}.json`).toPromise()
              .then(details => ({
                ...book, // Mantém as informações do livro
                genre: details.genre || 'Desconhecido', // Gênero vem do JSON do livro
                sinopse: details.sinopse || 'Sem descrição disponível',
                dateAdded: details.dateAdded, // GARANTE QUE ESTÁ SENDO ADICIONADO
                lastUpdated: details.lastUpdated // GARANTE QUE ESTÁ SENDO ADICIONADO
              }))
          );

        // Processa os livros e depois carrega os poemas
        Promise.all(bookRequests).then(booksWithDetails => {
          this.books = booksWithDetails;
          this.filteredBooks = this.books; // Inicialmente, todos os livros são visíveis
          this.updateGenres();

          // Agora carregamos os poemas e adicionamos à lista de livros
          this.http.get<{ Poemas: any, dateAdded?: string, lastUpdated?: string }>(`${environment.mainUrl}/_books/poemas/poemas.json`).subscribe(
            (poemData) => {
              const poemBook = {
                title: 'Poemas',
                sinopse: 'Apenas um gigantesco e infinito livro de poesias...',
                coverImage: `${environment.mainUrl}/_books/poemas/poemas_cover.png`,
                isPoem: true,
                genre: 'Poesia', // Define o gênero do livro de poemas
                dateAdded: poemData.dateAdded, // GARANTE QUE ESTÁ SENDO ADICIONADO
                lastUpdated: poemData.lastUpdated, // GARANTE QUE ESTÁ SENDO ADICIONADO
                poems: poemData.Poemas
              };

              this.books = [...this.books, poemBook]; // Atualiza corretamente a lista
              this.updateGenres();

              console.log('📚 Livros + 📖 Poemas carregados:', this.books.map((b, i) => `Livro ${i + 1}: ${b.title}`));
              console.log("🎭 Gêneros atualizados:", this.genres);

              // 🔄 FORÇAR A ATUALIZAÇÃO DA INTERFACE
              this.books = [...this.books];

              // Espera um pouco e verifica de novo
              setTimeout(() => {
                console.log("🔍 Verificando livros APÓS renderização:", this.books.map((b, i) => `Livro ${i + 1}: ${b.title}`));
              }, 500);
            },
            (error) => console.error('❌ Erro ao carregar poemas:', error)
          );
        });

      },
      (error) => {
        console.error('❌ Erro ao carregar livros:', error);
      }
    );
  }

  searchBooks() {
    this.filteredBooks = this.books.filter(book => {
      const matchesSearchQuery = this.searchQuery.trim() === '' ||
        book.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        book.genre.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        book.sinopse.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesSearchQuery && (this.selectedGenre === 'Todos' || book.genre === this.selectedGenre);
    });
  }

  updateGenres() {
    this.genres = ['Todos', ...new Set(this.books.map(book => book.genre).filter(Boolean))];
    console.log("🎭 Gêneros atualizados:", this.genres);
    this.searchBooks(); // Atualiza a lista filtrada de livros sempre que os gêneros forem atualizados
  }

  onGenreSelect(genre: string, event: MouseEvent) {
    event.preventDefault(); // Impede a navegação do link
    this.selectedGenre = genre;
    this.searchBooks(); // Filtra os livros com o novo gênero
  }

  isNewBook(book: any): boolean {
    if (!book.dateAdded) {
      console.log(`⛔ ${book.title} não tem 'dateAdded'. Ignorando...`);
      return false; // Evita erro se a data não existir
    }

    const now = new Date();
    const bookDate = new Date(book.dateAdded);
    const diffInDays = (now.getTime() - bookDate.getTime()) / (1000 * 3600 * 24);

    console.log(`📘 ${book.title} foi adicionado em: ${bookDate.toISOString()}`);
    console.log(`📅 Diferença em dias: ${diffInDays}`);

    return diffInDays <= 7; // Considera novo se foi adicionado nos últimos 7 dias
  }

  hasNewPages(book: any): boolean {
    if (!book.lastUpdated) {
      console.log(`⛔ ${book.title} não tem 'lastUpdated'. Ignorando...`);
      return false; // Evita erro se não tiver a data de atualização
    }

    const now = new Date();
    const lastUpdateDate = new Date(book.lastUpdated);
    const diffInDays = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 3600 * 24);

    console.log(`📖 ${book.title} foi atualizado em: ${lastUpdateDate.toISOString()}`);
    console.log(`📅 Diferença em dias: ${diffInDays}`);

    return diffInDays <= 3; // Considera "nova página" se foi atualizado nos últimos 3 dias
  }


  // Método para substituir underscores por espaços
  formatTitle(title: string): string {
    return title.replace(/_/g, ' ');
  }

  // openBook(book: any) {
  //   this.selectedBook = book;
  //   console.log(this.selectedBook);
  // }

  openBook(book: any) {
    console.log("📖 Livro selecionado antes do tratamento:", book);

    if (!book) {
      console.error("❌ ERRO: Tentativa de abrir um livro, mas 'book' é undefined ou null!");
      return;
    }

    if (book.isPoem) {
      console.log("📜 Este é um livro de poemas! Formatando corretamente...");

      this.selectedBook = {
        ...book, // Mantém todas as propriedades originais
        page: book.poems.reduce((pages: { [x: string]: string; }, poema: { title: any; strophes: any[]; }, index: number) => {
          pages[index + 1] = `<b>${poema.title}</b>\n\n${poema.strophes.map(strophe => strophe.trim()).join('\n')}`;
          return pages;
        }, {})
      };

      console.log("✅ Livro de poemas formatado:", this.selectedBook);
    } else {
      this.selectedBook = book;
    }

    // 🚀 Garante que a interface será atualizada corretamente
    setTimeout(() => {
      console.log("📖 Livro selecionado FINAL (atualizado):", this.selectedBook);
    }, 100);
  }


  closeBook() {
    this.selectedBook = null;
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

}
