import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { SubscriptionsGrpcClient } from '../grpc/subscriptions-grpc.client';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsGrpcClient],
})
export class SubscriptionsModule {}
