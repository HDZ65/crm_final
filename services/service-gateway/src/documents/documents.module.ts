import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { DocumentsGrpcClient } from '../grpc/documents-grpc.client';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsGrpcClient],
})
export class DocumentsModule {}
