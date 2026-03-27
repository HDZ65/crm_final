import { Module } from '@nestjs/common';

import {
  AlertesController,
  DashboardKpisController,
  EvolutionCaController,
  KpisCommerciauxController,
  RepartitionProduitsController,
  StatsSocietesController,
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
