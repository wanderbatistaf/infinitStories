import {Component, OnInit} from '@angular/core';
import { PoemaService } from '../_services/poema.service';
import { HttpClientModule } from '@angular/common/http';
import {BookService} from "../_services/book.service";
import {NgForOf, NgIf} from "@angular/common";
import {AuthService} from "../_services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-poema',
  standalone: true,
  imports: [NgForOf, NgIf], // Garantindo suporte a *ngIf e *ngFor
  template: `
    <div class="dashboard">
      <h1>Painel de Gerenciamento de Livros e Poemas 📖</h1>

      <!-- Seção de Controle -->
      <div class="control-section">
        <h2>📜 Gerar Poema</h2>
        <button class="generate-button" (click)="gerarPoema()">Gerar Novo Poema</button>
      </div>

      <!-- Seção de Criação de Livro -->
      <div class="control-section">
        <h2>📖 Criar Novo Livro</h2>
        <!-- Nome do Livro -->
        <input #bookname class="input-field" placeholder="Nome do Livro">
        <!-- Gênero do Livro -->
        <input #genero class="input-field" placeholder="Gênero do Livro">
        <!-- Protagonista -->
        <input #protagonist class="input-field" placeholder="Protagonista">
        <!-- Personagens -->
        <input #characters class="input-field" placeholder="Personagens (separados por vírgula)">
        <!-- Localização -->
        <input #location class="input-field" placeholder="Localização">
        <!-- Ano -->
        <input #year class="input-field" placeholder="Ano de Publicação">
        <!-- Tom -->
        <input #tone class="input-field" placeholder="Tom da História (ex: Inspirador, Sombrio)">
        <!-- Informações Adicionais -->
        <input #additionalInfo class="input-field" placeholder="Informações Adicionais">
        <!-- Botão para Criar Livro -->
        <button class="generate-button" (click)="gerarLivro(bookname.value, genero.value, protagonist.value, characters.value, location.value, year.value, tone.value, additionalInfo.value)">Criar Livro</button>
      </div>


      <!-- Seção para Gerar Próxima Página -->
      <div class="control-section">
        <h2>📄 Gerar Próxima Página</h2>
        <select #selectedBook class="input-field">
          <option *ngFor="let book of books" [value]="book.title">{{ book.title }}</option>
        </select>
        <button class="next-page-button" (click)="handleGenerateNextPage(selectedBook.value)">
          Gerar Página
        </button>
      </div>



      <!-- Exibição do Poema Gerado -->
      <div *ngIf="poemaGerado" class="output">
        <h2>📜 Poema Gerado</h2>
        <p>{{ poemaGerado }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      width: 80%;
      margin: auto;
      text-align: center;
      font-family: 'Arial', sans-serif;
      padding: 20px;
      background: #f4f4f4;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    h1 {
      color: #333;
      font-size: 28px;
      margin-bottom: 20px;
    }

    .control-section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
      font-size: 20px;
      color: #007BFF;
      margin-bottom: 15px;
    }

    .input-field {
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ccc;
      border-radius: 5px;
      width: 80%;
      margin-bottom: 10px;
    }

    .generate-button, .next-page-button {
      padding: 12px;
      font-size: 16px;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      width: 50%;
    }

    .generate-button {
      background-color: #007BFF;
    }

    .next-page-button {
      background-color: #28A745;
    }

    .output {
      margin-top: 20px;
      padding: 15px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    p {
      font-size: 18px;
      color: #333;
    }
  `]
})
export class PoemaComponent implements OnInit {
  books: any[] = []; // Array para armazenar os livros disponíveis
  selectedBook = ''; // Armazena o livro selecionado
  isAuthenticated = false;
  poemaGerado: string = '';
  showPoemaViewer: any;
  currentPage:any;
  poemas:any;
  private genero: any | string;
  private additionalInfo: any | string;
  private protagonist: any | string;
  private location: any | string;
  private year: any | string;
  private tone: any | string;
  private characters: string | undefined;


  constructor(private poemaService: PoemaService, private bookService: BookService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadBooks(); // Carrega os livros disponíveis ao inicializar
    this.bookService.getBooks().subscribe(
      (data) => {
        this.books = data; // Armazena os livros na variável
      },
      (error) => {
        console.error('Erro ao carregar livros:', error);
      }
    );
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
  }

  prepareNextPageParams(): [
    string, string, string, string, string[], string, string, string
  ] {
    const charactersArray = this.characters ? this.characters.split(',').map((s: string) => s.trim()) : [];
    return [
      this.selectedBook || '',
      this.genero || '',
      this.additionalInfo || '',
      this.protagonist || '',
      charactersArray,  // Passando o array de strings
      this.location || '',
      this.year || '',
      this.tone || ''
    ];
  }



  handleGenerateNextPage(selectedBookName: string) {
    console.log('Livro selecionado:', selectedBookName);

    // Chama a função no serviço passando apenas o bookName
    this.bookService.gerarProxPaginaLivro(selectedBookName).subscribe(response => {
      console.log('Resposta do backend:', response);
    });
  }



  gerarPoema(): void {
    this.poemaService.gerarPoema().subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);

        if (response.candidates && response.candidates.length > 0) {
          const poemaData = this.poemaService.processarResposta(response); // Processa a resposta para obter o poema e o título

          console.log('Poema gerado:', poemaData);

          // Salva o poema no servidor
          this.poemaService.salvarPoemaEmLivroJson(poemaData); // Chamada sem subscribe, pois não é um Observable
          console.log('Poema salvo com sucesso no servidor!');
        } else {
          console.error('Nenhum poema foi gerado.');
        }
      },
      error: (err) => {
        console.error('Erro ao gerar poema:', err);
      }
    });
  }

  // gerarLivro(
  //   bookName: string,
  //   genero: string,
  //   protagonist: string,
  //   characters: string,
  //   location: string,
  //   year: string,
  //   tone: string,
  //   additional_info: string
  // ): void {
  //   // 1. Gerar sinopse do livro
  //   this.bookService.gerarSinopse(bookName, genero).subscribe({
  //     next: (sinopseResponse) => {
  //       console.log('Sinopse gerada:', sinopseResponse);
  //
  //       if (sinopseResponse && sinopseResponse.sinopsePt && sinopseResponse.sinopseEn) {
  //         const sinopse = sinopseResponse.sinopseEn;
  //
  //         // 2. Gerar a capa do livro usando a sinopse
  //         this.bookService.gerarCapaLivro(bookName, sinopse, genero).subscribe({
  //           next: (capaResponse) => {
  //             console.log('Capa gerada:', capaResponse);
  //
  //             const coverImage = capaResponse.image;
  //
  //             // 3. Gerar a primeira página do livro
  //             this.bookService.gerarPaginaLivro(
  //               bookName,
  //               genero,
  //               "1",  // Número da página (sempre 1 para o início)
  //               protagonist,  // Protagonista
  //               characters,  // Personagens
  //               location,  // Localização
  //               year,  // Ano
  //               tone,  // Tom
  //               additional_info  // Informações adicionais
  //             ).subscribe({
  //               next: (paginaResponse) => {
  //                 console.log('Página gerada:', paginaResponse);
  //
  //                 // Verificar se candidates existem e acessar a estrutura correta
  //                 if (paginaResponse && paginaResponse.candidates && paginaResponse.candidates.length > 0) {
  //                   const pageData = paginaResponse.candidates[0];
  //                   console.log('PageData:', pageData);
  //
  //                   // Acessar a parte relevante
  //                   if (pageData.content && pageData.content.parts && pageData.content.parts.length > 0) {
  //                     const partText = pageData.content.parts[0].text;
  //                     console.log('Texto da parte:', partText);
  //
  //                     // Limpar o texto para remover a formatação do markdown
  //                     const cleanedText = partText.replace(/```json/g, '').replace(/```/g, '').trim();
  //                     console.log('Texto limpo:', cleanedText);
  //
  //                     // Tentar analisar o JSON
  //                     try {
  //                       const jsonObject = JSON.parse(cleanedText);
  //                       console.log('JSON analisado:', jsonObject);
  //
  //                       // Acessar o texto da página e o número da página
  //                       if (jsonObject.page && jsonObject.page.pageNumber) {
  //                         const pageNumber = jsonObject.page.pageNumber;  // Acessando o número da página
  //
  //                         // Concatenar todos os textos da mesma página
  //                         const concatenatedText = jsonObject.page.text; // Acessar o texto diretamente
  //
  //                         if (concatenatedText) {
  //                           // Salva a primeira página no JSON
  //                           this.bookService.salvarLivroEmLivroJson(
  //                             bookName,
  //                             genero,
  //                             sinopseResponse.sinopsePt,
  //                             { [pageNumber]: concatenatedText },
  //                             coverImage,
  //                             protagonist,
  //                             Array.isArray(characters) ? characters : characters.split(',').map(c => c.trim()), // Garantindo que seja um array
  //                             location,
  //                             year,
  //                             tone
  //                           );
  //
  //                           console.log('Livro salvo com sucesso no JSON!');
  //                         } else {
  //                           console.error('Texto da página é indefinido:', concatenatedText);
  //                         }
  //                       } else {
  //                         console.error('Estrutura de jsonObject inválida para a página:', jsonObject);
  //                       }
  //                     } catch (e) {
  //                       console.error('Erro ao analisar JSON:', e);
  //                     }
  //                   } else {
  //                     console.error('Content ou partes não encontradas em PageData:', pageData);
  //                   }
  //                 } else {
  //                   console.error('Nenhuma página foi gerada ou estrutura de página inválida:', paginaResponse);
  //                 }
  //               },
  //               error: (err) => {
  //                 console.error('Erro ao gerar página:', err);
  //               }
  //             });
  //           },
  //           error: (err) => {
  //             console.error('Erro ao gerar capa:', err);
  //           }
  //         });
  //       } else {
  //         console.error('Nenhuma sinopse foi gerada. Resposta:', sinopseResponse);
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Erro ao gerar sinopse:', err);
  //     }
  //   });
  // }


  gerarLivro(
    bookName: string,
    genero: string,
    protagonist: string,
    characters: string,
    location: string,
    year: string,
    tone: string,
    additional_info: string
  ): void {
    // 1. Gerar sinopse do livro
    this.bookService.gerarSinopse(bookName, genero).subscribe({
      next: (sinopseResponse) => {
        console.log('📌 Sinopse gerada:', sinopseResponse);

        if (sinopseResponse?.sinopsePt && sinopseResponse?.sinopseEn) {
          const sinopse = sinopseResponse.sinopseEn;

          // 2. Gerar a capa do livro usando a sinopse
          this.bookService.gerarCapaLivro(bookName, sinopse, genero).subscribe({
            next: (capaResponse) => {
              console.log('📌 Capa gerada:', capaResponse);

              const coverImage = capaResponse.image; // Base64 da capa gerada

              // 3. Gerar a primeira página do livro
              this.bookService.gerarPaginaLivro(
                bookName,
                genero,
                "1", // Sempre começamos pela página 1
                protagonist,
                characters,
                location,
                year,
                tone,
                additional_info
              ).subscribe({
                next: (paginaResponse) => {
                  console.log('📌 Página gerada:', paginaResponse);

                  if (paginaResponse?.candidates?.length > 0) {
                    const pageData = paginaResponse.candidates[0];

                    if (pageData?.content?.parts?.length > 0) {
                      const partText = pageData.content.parts[0].text;
                      console.log('📌 Texto da parte recebido:', partText);

                      // Removendo formatação Markdown (caso exista)
                      const cleanedText = partText.replace(/```json/g, '').replace(/```/g, '').trim();

                      // Tentar analisar o JSON corretamente
                      try {
                        const jsonObject = JSON.parse(cleanedText);
                        console.log('✅ JSON analisado corretamente:', jsonObject);

                        if (jsonObject?.page?.pageNumber && jsonObject?.page?.text) {
                          const formattedBook = {
                            book: jsonObject.book || bookName,
                            genre: jsonObject.genre || genero,
                            sinopse: jsonObject.sinopse || sinopseResponse.sinopsePt,
                            page: { [jsonObject.page.pageNumber]: jsonObject.page.text },
                            protagonist: jsonObject.protagonist?.trim() || 'Desconhecido',
                            characters: Array.isArray(jsonObject.characters) ? jsonObject.characters : [],
                            location: jsonObject.location?.trim() || 'Não especificado',
                            year: jsonObject.year ? String(jsonObject.year) : 'Ano não informado',
                            tone: jsonObject.tone?.trim() || 'Não definido',
                            coverImage: coverImage || '' // ✅ Agora passamos a imagem corretamente!
                          };

                          // 🚀 Salvar o livro no JSON incluindo a capa
                          this.bookService.salvarLivroEmLivroJson(
                            formattedBook.book,
                            formattedBook.genre,
                            formattedBook.sinopse,
                            formattedBook.page,
                            formattedBook.coverImage, // ✅ Imagem Base64 da capa gerada
                            formattedBook.protagonist,
                            formattedBook.characters,
                            formattedBook.location,
                            formattedBook.year,
                            formattedBook.tone
                          );

                          console.log('📌 Livro salvo com sucesso no JSON!', formattedBook);
                        } else {
                          console.error('🚨 Estrutura inválida para a página:', jsonObject);
                        }
                      } catch (e) {
                        console.error('🚨 Erro ao analisar JSON:', e);
                      }
                    } else {
                      console.error('🚨 Nenhuma parte de texto encontrada em PageData:', pageData);
                    }
                  } else {
                    console.error('🚨 Nenhuma página foi gerada ou estrutura de página inválida:', paginaResponse);
                  }
                },
                error: (err) => {
                  console.error('🚨 Erro ao gerar página:', err);
                }
              });
            },
            error: (err) => {
              console.error('🚨 Erro ao gerar capa:', err);
            }
          });
        } else {
          console.error('🚨 Nenhuma sinopse foi gerada. Resposta:', sinopseResponse);
        }
      },
      error: (err) => {
        console.error('🚨 Erro ao gerar sinopse:', err);
      }
    });
  }



  // generateNextPage(
  //   bookName: string,
  //   genre: string,
  //   additionalInfo: string,
  //   protagonist: string,
  //   characters: string[],
  //   location: string,
  //   year: string,
  //   tone: string
  // ) {
  //   // Obtenha os detalhes do livro selecionado
  //   this.bookService.getBookDetails(bookName).subscribe(
  //     (bookDetails) => {
  //       const pages = bookDetails.page || [];
  //       const lastPage = pages[pages.length - 1]; // Última página
  //       const lastText = lastPage ? lastPage.generatedContent : ''; // Usando 'generatedContent' para pegar o texto da última página
  //
  //       // Chamar o serviço para gerar a próxima página, incluindo todos os campos necessários
  //       this.bookService.gerarProxPaginaLivro(
  //         bookName,
  //         genre,
  //         additionalInfo,
  //         lastText,
  //         protagonist,
  //         characters,
  //         location,
  //         year,
  //         tone
  //       )
  //         .subscribe(
  //           response => {
  //             console.log('Resposta da API:', response); // Para debugar a resposta
  //
  //             if (response.candidates && response.candidates.length > 0) {
  //               const newPageContent = response.candidates[0].content;
  //               const newPageText = Array.isArray(newPageContent) ? newPageContent.join(' ') : newPageContent;
  //
  //               // Atualize o array de páginas do livro
  //               bookDetails.page.push({ generatedContent: newPageText });
  //
  //               // Pode também salvar ou atualizar o livro, se necessário
  //             } else {
  //               console.error('Nenhum candidato retornado pela API.');
  //             }
  //           },
  //           error => {
  //             console.error('Erro ao gerar a próxima página:', error);
  //           }
  //         );
  //     },
  //     (error) => {
  //       console.error('Erro ao obter detalhes do livro:', error);
  //     }
  //   );
  // }


  loadBooks() {
    console.log('Carregando livros...'); // Log para quando começa a carregar os livros
    this.bookService.getBooks().subscribe(
      (data) => {
        console.log('Livros recebidos:', data); // Log dos dados recebidos
        this.books = data; // Armazena os livros recebidos
      },
      (error) => {
        console.error('Erro ao carregar livros:', error); // Log de erro
      }
    );
  }

  openPoemas(): void {
    this.poemaService.getPoemaPages().subscribe(
      (data: any) => {
        console.log('Poemas carregados:', data);
        this.poemas = data.Poemas || []; // Pega os poemas corretamente
        this.currentPage = 0; // Sempre começa na primeira página
        this.showPoemaViewer = true; // Mostra o visualizador de poemas
      },
      (error: any) => {
        console.error('Erro ao carregar poemas:', error);
      }
    );
  }



}


