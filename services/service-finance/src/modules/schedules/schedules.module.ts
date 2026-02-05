import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ScheduleEntity } from './entities/schedule.entity';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentEventEntity } from './entities/payment-event.entity';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PaymentEmissionJob } from './payment-emission.job';
import { IdempotencyService } from './idempotency.service';
import { GoCardlessModule } from '../gocardless/gocardless.module.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { CalendarModule } from '../calendar/calendar.module.js';
import { RetryModule } from '../retry/retry.module.js';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      ScheduleEntity,
      PaymentIntentEntity,
      PaymentEventEntity,
    ]),
    forwardRef(() => GoCardlessModule),
    forwardRef(() => StripeModule),
    CalendarModule,
    RetryModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService, PaymentEmissionJob, IdempotencyService],
  exports: [SchedulesService, PaymentEmissionJob, IdempotencyService],
})
export class SchedulesModule {}
