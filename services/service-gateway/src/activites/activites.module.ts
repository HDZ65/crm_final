import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { ActivitesGrpcClient } from '../grpc/activites-grpc.client';
import { ActivitesController } from './activites.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [ActivitesController],
  providers: [ActivitesGrpcClient],
})
export class ActivitesModule {}
