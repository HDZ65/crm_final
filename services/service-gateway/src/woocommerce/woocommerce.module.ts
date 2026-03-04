import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WoocommerceGrpcClient } from '../grpc/woocommerce-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { WoocommerceController } from './woocommerce.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [WoocommerceController],
  providers: [WoocommerceGrpcClient],
})
export class WoocommerceModule {}
