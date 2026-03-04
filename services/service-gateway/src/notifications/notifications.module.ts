import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { NotificationsGrpcClient } from '../grpc/notifications-grpc.client';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [AuthModule, GrpcClientModule],
  controllers: [NotificationsController],
  providers: [NotificationsGrpcClient],
})
export class NotificationsModule {}
