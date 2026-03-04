import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BundleGrpcClient } from '../grpc/bundle-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { BundleController } from './bundle.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [BundleController],
  providers: [BundleGrpcClient],
})
export class BundleModule {}
