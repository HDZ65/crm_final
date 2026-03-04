import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { UsersGrpcClient } from '../grpc/users-grpc.client';
import { UsersController } from './users.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersGrpcClient],
})
export class UsersModule {}
