import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsGrpcClient } from '../grpc/clients-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { ClientsController } from './clients.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [ClientsController],
  providers: [ClientsGrpcClient],
})
export class ClientsModule {}
