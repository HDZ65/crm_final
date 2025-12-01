// src/infrastructure/services/ai.service.ts
import { Injectable } from '@nestjs/common';
import { LlmGrpcClient } from '../grpc/llm.client';
import type { Observable } from 'rxjs';
import type { TokenChunk } from '../../core/port/llm.port';

@Injectable()
export class AiService {
  private readonly client = new LlmGrpcClient();

  async generateOnce(prompt: string): Promise<string> {
    return this.client.generate(prompt);
  }

  generateStream(prompt: string): Observable<TokenChunk> {
    return this.client.generateStream(prompt);
  }
}
