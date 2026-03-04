import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { DepanssurGrpcClient } from '../grpc/depanssur-grpc.client';
import { DepanssurController } from './depanssur.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [DepanssurController],
  providers: [DepanssurGrpcClient],
})
export class DepanssurModule {}
