import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai/controllers/ai.controller';
import { GenerateTextUseCase } from '../../../applications/usecase/generate-text.usecase';
import { LlmGrpcClient } from '../../grpc/llm.client';
import { LLM_PORT } from '../../../core/port/tokens';
import { SecurityModule } from './security.module';

/**
 * Module AI autonome sans dépendance à TypeORM/PostgreSQL
 * Utiliser ce module si vous voulez uniquement le module AI
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SecurityModule],
  controllers: [AiController],
  providers: [
    GenerateTextUseCase,
    {
      provide: LLM_PORT,
      useClass: LlmGrpcClient,
    },
  ],
})
export class AiStandaloneModule {}
