import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { WincashGrpcClient } from '../grpc/wincash-grpc.client';
import { WincashController } from './wincash.controller';

@Module({
  imports: [AuthModule, GrpcClientModule],
  controllers: [WincashController],
  providers: [WincashGrpcClient],
})
export class WincashModule {}
