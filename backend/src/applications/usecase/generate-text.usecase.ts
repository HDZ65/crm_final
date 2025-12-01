import { Inject, Injectable } from '@nestjs/common';
import { LLM_PORT } from '../../core/port/tokens';
import { Observable } from 'rxjs';
import type { ILlmPort, TokenChunk } from '../../core/port/llm.port';

@Injectable()
export class GenerateTextUseCase {
  constructor(@Inject(LLM_PORT) private readonly llm: ILlmPort) {}

  async execute(prompt: string, systemPrompt?: string, sessionId?: string): Promise<string> {
    return this.llm.generate(prompt, systemPrompt, sessionId);
  }

  executeStream(prompt: string, systemPrompt?: string, sessionId?: string): Observable<TokenChunk> {
    return this.llm.generateStream(prompt, systemPrompt, sessionId);
  }
}
