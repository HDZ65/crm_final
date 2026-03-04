import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { FacturesGrpcClient } from '../grpc/factures-grpc.client';
import { FacturesController } from './factures.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [FacturesController],
  providers: [FacturesGrpcClient],
})
export class FacturesModule {}
