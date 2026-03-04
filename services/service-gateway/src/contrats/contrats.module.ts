import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContratExtendedGrpcClient } from '../grpc/contrat-extended-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { ContratsController } from './contrats.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [ContratsController],
  providers: [ContratExtendedGrpcClient],
})
export class ContratsModule {}
