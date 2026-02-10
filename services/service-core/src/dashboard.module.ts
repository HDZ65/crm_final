import { Module } from '@nestjs/common';

import {
  DashboardKpisController,
  StatsSocietesController,
  EvolutionCaController,
  KpisCommerciauxController,
  RepartitionProduitsController,
  AlertesController,
} from './infrastructure/grpc/dashboard';

@Module({
  controllers: [
    DashboardKpisController,
    StatsSocietesController,
    EvolutionCaController,
    KpisCommerciauxController,
    RepartitionProduitsController,
    AlertesController,
  ],
})
export class DashboardModule {}
