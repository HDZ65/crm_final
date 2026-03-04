import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { OrganisationsGrpcClient } from '../grpc/organisations-grpc.client';
import { OrganisationsController } from './organisations.controller';

@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsGrpcClient],
})
export class OrganisationsModule {}
