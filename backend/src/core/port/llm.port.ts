import { Observable } from 'rxjs';

export type TokenChunk = { token: string; is_final: boolean };

export interface ILlmPort {
  generate(prompt: string, systemPrompt?: string, sessionId?: string): Promise<string>;
  generateStream(prompt: string, systemPrompt?: string, sessionId?: string): Observable<TokenChunk>;
}
