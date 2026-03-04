import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScoringGrpcClient } from '../grpc/scoring-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [ScoringController],
  providers: [ScoringGrpcClient],
})
export class ScoringModule {}
