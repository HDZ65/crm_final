import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { DashboardGrpcClient } from '../grpc/dashboard-grpc.client';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardGrpcClient],
})
export class DashboardModule {}
