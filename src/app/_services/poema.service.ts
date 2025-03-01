import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {catchError, Observable, of} from 'rxjs';
import {environment} from "../../environments/environment.prod";

interface PoemaData {
  estrofes: string;
  poema: string;
  strophes: string;
}

@Injectable({
  providedIn: 'root'
})
export class PoemaService {
  private apiKey: string = environment.geminiApiKey // Coloque sua chave da API aqui
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(private http: HttpClient) {}

  gerarPoema(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      contents: [{
        parts: [{ text: "Em JSON, com o formato { 'poema':'title', 'strophes':'text' } escreva um poema. Certifique-se de que não haja plágio. Lembre-se de" +
            "quebrar linha após certa quantidade de linhas." }]
      }]
    };

    return this.http.post<any>(`${this.baseUrl}?key=${this.apiKey}`, body, { headers });
  }

  salvarPoemaEmLivroJson(poemaData: { estrofes: string; poema: string; strophes: any[] }) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    // Garantir que estamos enviando `strophes` corretamente
    const poemaFormatado = {
      title: poemaData.poema, // Ajuste para "title"
      strophes: poemaData.strophes // Agora `strophes` sempre terá um valor válido
    };

    // console.log("📤 Enviando poema para API:", poemaFormatado);

    this.http.post(`${environment.mainUrl}/salvar_poema`, poemaFormatado, { headers }).subscribe({
      next: () => console.log("✅ Poema salvo com sucesso no servidor!"),
      error: (err) => console.error("❌ Erro ao salvar poema:", err)
    });
  }



  processarResposta(resposta: any): { estrofes: string; poema: string; strophes: any[] } {
    const poemaRaw = resposta.candidates[0].content.parts[0].text;

    // Limpa caracteres como '+' e quebra de linhas de JSON
    const poemaLimpado = poemaRaw.replace(/\n/g, "").replace(/\r/g, "");

    const jsonStartIndex = poemaLimpado.indexOf('{');
    const jsonEndIndex = poemaLimpado.lastIndexOf('}');

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      const jsonString = poemaLimpado.substring(jsonStartIndex, jsonEndIndex + 1);
      try {
        const poemaObject = JSON.parse(jsonString);
        // console.log("🔍 Poema processado corretamente:", poemaObject);

        return {
          estrofes: "",
          poema: poemaObject.poema || "Título não disponível",
          strophes: poemaObject.estrofes || poemaObject.strophes || [] // Garante que "strophes" sempre será preenchido
        };
      } catch (error) {
        console.error('❌ Erro ao processar o poema:', error, 'Resposta completa:', poemaRaw);
        return {estrofes: "", poema: "Título não disponível", strophes: [] };
      }
    } else {
      console.error('❌ Formato inesperado da resposta do poema:', poemaRaw);
      return {estrofes: "", poema: "Título não disponível", strophes: [] };
    }
  }


  getPoemaPages(): Observable<any> {
    return this.http.get<any>(`${environment.mainUrl}/api/poemas`)
      .pipe(
        catchError((error: any) => {
          console.error('Erro ao carregar poemas:', error);
          return of({ Poemas: [] }); // Retorna um objeto vazio caso haja erro
        })
      );
  }


}
