import { Module } from '@nestjs/common';

// Controllers
import { AiController } from './controllers/ai.controller';

// Services
import { LlmGrpcClient } from '../../../grpc/llm.client';
import { LLM_PORT } from '../../../../core/port/tokens';

// Use Cases
import { GenerateTextUseCase } from '../../../../applications/usecase/generate-text.usecase';

@Module({
  controllers: [AiController],
  providers: [
    // LLM Client
    {
      provide: LLM_PORT,
      useClass: LlmGrpcClient,
    },

    // AI Use Cases
    GenerateTextUseCase,
  ],
  exports: [LLM_PORT, GenerateTextUseCase],
})
export class AiModule {}
