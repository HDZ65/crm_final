import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { ProductsGrpcClient } from '../grpc/products-grpc.client';
import { ProductsController } from './products.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [ProductsController],
  providers: [ProductsGrpcClient],
})
export class ProductsModule {}
