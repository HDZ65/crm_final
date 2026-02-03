import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { NotificationModule } from '../notifications/notification/notification.module';

import { EmailClientCreatedHandler } from './email/client-created.handler';
import { EmailContractSignedHandler } from './email/contract-signed.handler';
import { EmailInvoiceCreatedHandler } from './email/invoice-created.handler';
import { EmailPaymentRejectedHandler } from './email/payment-rejected.handler';

import { NotificationClientCreatedHandler } from './notifications/client-created.handler';
import { NotificationInvoiceCreatedHandler } from './notifications/invoice-created.handler';
import { NotificationPaymentReceivedHandler } from './notifications/payment-received.handler';
import { NotificationPaymentRejectedHandler } from './notifications/payment-rejected.handler';

import { DashboardClientCreatedHandler } from './dashboard/client-created.handler';
import { DashboardInvoiceCreatedHandler } from './dashboard/invoice-created.handler';
import { DashboardPaymentReceivedHandler } from './dashboard/payment-received.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent]), NotificationModule],
  providers: [
    ProcessedEventsRepository,
    EmailClientCreatedHandler,
    EmailContractSignedHandler,
    EmailInvoiceCreatedHandler,
    EmailPaymentRejectedHandler,
    NotificationClientCreatedHandler,
    NotificationInvoiceCreatedHandler,
    NotificationPaymentReceivedHandler,
    NotificationPaymentRejectedHandler,
    DashboardClientCreatedHandler,
    DashboardInvoiceCreatedHandler,
    DashboardPaymentReceivedHandler,
  ],
})
export class EventsModule {}
