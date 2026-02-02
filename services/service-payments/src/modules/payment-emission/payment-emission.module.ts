import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentIntentEntity } from '../schedules/entities/payment-intent.entity';
import { PaymentEmissionJob } from './payment-emission.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([PaymentIntentEntity]),
  ],
  providers: [PaymentEmissionJob],
  exports: [PaymentEmissionJob],
})
export class PaymentEmissionModule {}
