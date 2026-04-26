import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EdgeLlmService {
  private apiUrl = 'http://localhost:3000/api/ai/chat';

  ready$ = new BehaviorSubject<boolean>(true);
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  async summarize(text: string): Promise<string> {
    return this.call([
      { role: 'system', content: 'You are a concise note summarizer. Respond with 2-3 sentences only.' },
      { role: 'user', content: `Summarize this note:\n\n${text}` },
    ]);
  }

  async generateTags(text: string): Promise<string[]> {
    const result = await this.call([
      { role: 'system', content: 'Return exactly 5 short lowercase tags as a comma-separated list. Nothing else.' },
      { role: 'user', content: `Tags for this note:\n\n${text}` },
    ]);
    return result.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean).slice(0, 5);
  }

  async ask(question: string, context: string): Promise<string> {
    return this.call([
      { role: 'system', content: 'You are a helpful assistant answering questions about a note. Be concise.' },
      { role: 'user', content: `Note content:\n${context}\n\nQuestion: ${question}` },
    ]);
  }

  private async call(messages: { role: string; content: string }[]): Promise<string> {
    this.loading$.next(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; content: string; error?: string }>(this.apiUrl, { messages })
      );
      if (!res.success) throw new Error(res.error || 'AI request failed');
      return res.content.trim();
    } finally {
      this.loading$.next(false);
    }
  }
}
