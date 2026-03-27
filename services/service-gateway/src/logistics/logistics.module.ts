import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { LogisticsGrpcClient } from '../grpc/logistics-grpc.client';
import { LogisticsController } from './logistics.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [LogisticsController],
  providers: [LogisticsGrpcClient],
})
export class LogisticsModule {}
