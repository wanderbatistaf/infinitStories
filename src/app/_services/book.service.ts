import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {catchError, map, Observable, of, switchMap} from 'rxjs';
import {environment} from "../../environments/environment.prod";

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private basePath = '_books';

  geminiApiKey = environment.geminiApiKey;
  stabilityApiKey = environment.stabilityApiKey;
  openAiKey = environment.openAiKey;

  private geminiModelUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + this.geminiApiKey;
  private stabilityImageUrl: string = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image'; // URL da API de geração de imagens
  private imageUrl: string = 'https://api.openai.com/v1/images/generations'; // URL da API de geração de imagens
  private bookUrl: string = `${environment.mainUrl}/api/livros`;

  constructor(private http: HttpClient) {}

  gerarSinopse(bookName: string, genre: string): Observable<any> {
    // Gerar a sinopse em português
    const messagePt = `Escreva uma sinopse para um livro chamado '${bookName}' no gênero ${genre} em português.`;
    return this.sendMessage(messagePt).pipe(
      switchMap(responsePt => {
        console.log('Resposta em português:', responsePt); // Log para verificar a resposta
        // Verifica se a resposta contém 'candidates'
        if (responsePt && responsePt.candidates && responsePt.candidates.length > 0) {
          const parts = responsePt.candidates[0].content?.parts;
          if (parts && parts.length > 0) {
            const sinopsePt = parts[0].text.trim();
            console.log('Sinopse gerada em português:', sinopsePt);

            // Traduzir a sinopse para o inglês
            const messageEn = `Traduz esta sinopse para o inglês: '${sinopsePt}'`;
            return this.sendMessage(messageEn).pipe(
              map(responseEn => {
                console.log('Resposta em inglês:', responseEn); // Log para verificar a resposta
                // Verifica se a resposta contém 'candidates'
                if (responseEn && responseEn.candidates && responseEn.candidates.length > 0) {
                  const enParts = responseEn.candidates[0].content?.parts;
                  if (enParts && enParts.length > 0) {
                    const sinopseEn = enParts[0].text.trim();
                    console.log('Sinopse gerada em inglês:', sinopseEn);
                    return { sinopsePt, sinopseEn };
                  } else {
                    console.error('Nenhuma parte foi gerada na sinopse em inglês.');
                    return { sinopsePt, sinopseEn: null };
                  }
                } else {
                  console.error('Nenhuma sinopse em inglês foi gerada.');
                  return { sinopsePt, sinopseEn: null };
                }
              })
            );
          } else {
            console.error('Nenhuma parte foi gerada na sinopse em português.');
            return of({ sinopsePt: null, sinopseEn: null });
          }
        } else {
          console.error('Nenhuma sinopse em português foi gerada.');
          return of({ sinopsePt: null, sinopseEn: null });
        }
      })
    );
  }

  gerarCapaLivro(bookName: string, sinopseEn: string, genero: string): Observable<any> {
    const url = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.stabilityApiKey}`,
    });

    const body = {
      steps: 40,
      width: 1024,
      height: 1024,
      seed: 0,
      cfg_scale: 5,
      samples: 1,
      text_prompts: [
        {
          text: `A high-quality book cover for a ${genero} book titled "${bookName}". Description: ${sinopseEn}`,
          weight: 1
        },
        {
          text: "blurry, dark",
          weight: -1
        }
      ]
    };

    return this.http.post(url, body, { headers }).pipe(
      map((response: any) => {
        if (response.artifacts && response.artifacts.length > 0) {
          const image = response.artifacts[0].base64;
          return { image, response }; // Retorna a imagem junto com a resposta
        }
        return null;
      })
    );
  }

  // Método para gerar a próxima página do livro
  gerarPaginaLivro(
    bookName: string,
    genre: string,
    pageNumber: string,
    protagonist: string,
    characters: string,
    location: string,
    year: string,
    tone: string,
    additionalInfo: string = ''
  ): Observable<any> {
    // Supondo que 'characters' seja uma string com os personagens separados por vírgula
    const charactersArray = characters.split(',');  // Converte a string para um array
    const charactersText = charactersArray.join(', ');  // Agora podemos usar join

    // Agora, você pode usar os personagens na string da seguinte forma
    const frase = `Os personagens principais são ${charactersText}.`;

    const message = `
    "No formato JSON formatado corretamente {book, genre, sinopse, protagonist, characters, location, year, tone, page[pageNumber:text]}, vamos escrever o livro ${bookName}".
    Cada página deve conter entre 3 e 5 parágrafos.
    Escreva a página ${pageNumber}, utilizando linguagem simples e evitando palavras em inglês.
    O gênero deste livro é ${genre}.
    O protagonista da história é ${protagonist}.
    ${frase}.
    A história se passa em ${location} e o ano é ${year}.
    O tom da história é ${tone}.
    Certifique-se de que não haja plágio. ${additionalInfo}
  `;
    return this.sendMessage(message);
  }

  gerarProxPaginaLivro(bookName: string): Observable<any> {
    const url = `${environment.mainUrl}/gerar_pagina/${bookName}`; // URL para gerar a próxima página

    // Printar no console os dados que estão sendo enviados
    console.log("Dados enviados para o servidor:", { bookName });

    return this.http.post(url, { bookName }); // Apenas passando o bookName
  }

  sendMessage(message: string): Observable<any> {
    const body = {
      contents: [{
        parts: [{ text: message }]
      }]
    };
    return this.http.post(this.geminiModelUrl, body, { headers: { 'Content-Type': 'application/json' } });
  }

  salvarLivroEmLivroJson(
    title: string, genre: string, sinopse: string,
    page: { [p: number]: string }, coverImageBase64: string,
    protagonist: string, characters: string[],
    location: string, year: string, tone: string
  ) {

    if (!coverImageBase64) {
      console.error('Erro: coverImageBase64 está indefinido.');
      return;
    }

    console.log('coverImageBase64:', coverImageBase64); // Log para verificar a imagem base64

    // Criando o objeto do livro corretamente estruturado
    const livro = {
      book: title,
      genre: genre,
      sinopse: sinopse,
      page: page,
      protagonist: protagonist || '',
      characters: characters.length ? characters : [], // Corrigido: garantir array
      location: location || '',
      year: year || '',
      tone: tone || ''
    };

    const formData = new FormData();
    formData.append('book', title);
    formData.append('genre', genre);
    formData.append('sinopse', sinopse);
    formData.append('page', JSON.stringify(page));
    formData.append('protagonist', protagonist || '');
    formData.append('characters', JSON.stringify(characters || [])); // Corrigido
    formData.append('location', location || '');
    formData.append('year', year || '');
    formData.append('tone', tone || '');

    // Converter Base64 para Blob corretamente
    function base64ToBlob(base64: string, type: string) {
      const binaryString = window.atob(base64); // Decodifica a base64
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type });
    }

    // Criar Blob e anexar ao FormData
    const mimeType = 'image/png';
    const blob = base64ToBlob(coverImageBase64, mimeType);
    formData.append('coverImage', blob, `${title.replace(/\s/g, '_')}_cover.png`);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "${environment.mainUrl}/salvar_livro", true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        console.log('Livro e imagem salvos com sucesso.');
      } else {
        console.error('Erro ao salvar livro:', xhr.responseText);
      }
    };
    xhr.send(formData);
  }


  getBooks(): Observable<any[]> {
    return this.http.get<any[]>(this.bookUrl);
  }

}

