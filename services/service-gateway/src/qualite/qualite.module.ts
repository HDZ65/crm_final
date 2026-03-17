import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QualiteGrpcClient } from '../grpc/qualite-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { QualiteController } from './qualite.controller';

/**
 * Qualite module — provides a gRPC facade over ControleQualiteService
 * from service-commercial for quality control workflows.
 */
@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [QualiteController],
  providers: [QualiteGrpcClient],
})
export class QualiteModule {}
