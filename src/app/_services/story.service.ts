import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class StoryService {

  constructor(private http: HttpClient) {}

  continueStory(lastParagraph: string) {
    const prompt = `Continue the following paragraph: ${lastParagraph}`;
    const body = {
      prompt: prompt,
      max_tokens: 150,
    };

    return this.http.post(environment.apiUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${environment.apiKey}`,
      },
    });
  }
}
