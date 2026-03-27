import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { PaymentsGrpcClient } from '../grpc/payments-grpc.client';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsGrpcClient],
})
export class PaymentsModule {}
