import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommissionGrpcClient } from '../grpc/commission-grpc.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { CommissionController } from './commission.controller';

/**
 * Commission module — provides a gRPC facade over 6 commission sub-services:
 *   CommissionCrudService, CommissionBordereauService,
 *   CommissionCalculationService, CommissionContestationService,
 *   CommissionValidationService, CommissionDashboardService
 */
@Module({
  imports: [GrpcClientModule, AuthModule],
  controllers: [CommissionController],
  providers: [CommissionGrpcClient],
})
export class CommissionModule {}
