import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ScheduleEntity } from './entities/schedule.entity.js';
import { PaymentIntentEntity } from './entities/payment-intent.entity.js';
import { PaymentEventEntity } from './entities/payment-event.entity.js';
import { SchedulesService } from './schedules.service.js';
import { PaymentEmissionJob } from './payment-emission.job.js';
import { IdempotencyService } from './idempotency.service.js';
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
  providers: [SchedulesService, PaymentEmissionJob, IdempotencyService],
  exports: [SchedulesService, PaymentEmissionJob, IdempotencyService],
})
export class SchedulesModule {}
