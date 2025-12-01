/**
 * AI Providers - Intelligence Artificielle & LLM
 * Regroupement des providers liés à l'IA et aux modèles de langage
 */

import { GenerateTextUseCase } from '../../../../applications/usecase/generate-text.usecase';
import { LlmGrpcClient } from '../../../grpc/llm.client';
import { LLM_PORT } from '../../../../core/port/tokens';

export const AI_PROVIDERS = [
  // LLM Client
  {
    provide: LLM_PORT,
    useClass: LlmGrpcClient,
  },

  // AI Use Cases
  GenerateTextUseCase,
];
