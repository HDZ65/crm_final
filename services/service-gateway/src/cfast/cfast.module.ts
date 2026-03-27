import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { CfastGrpcClient } from '../grpc/cfast-grpc.client';
import { CfastController } from './cfast.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [CfastController],
  providers: [CfastGrpcClient],
})
export class CfastModule {}
