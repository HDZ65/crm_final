import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { CommerciauxGrpcClient } from '../grpc/commerciaux-grpc.client';
import { CommerciauxController } from './commerciaux.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [CommerciauxController],
  providers: [CommerciauxGrpcClient],
})
export class CommerciauxModule {}
