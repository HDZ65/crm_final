import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalPaymentSessionEntity } from './entities/portal-session.entity';
import { PortalSessionAuditEntity } from './entities/portal-session-audit.entity';
import { PSPEventInboxEntity } from './entities/psp-event-inbox.entity';
import { PortalSessionService } from './portal-session.service';
import { PortalPSPService } from './portal-psp.service';
import { PortalQueryService } from './portal-query.service';
import { StripeModule } from '../stripe/stripe.module.js';
import { GoCardlessModule } from '../gocardless/gocardless.module.js';
import { SlimpayModule } from '../slimpay/slimpay.module.js';
import { MultiSafepayModule } from '../multisafepay/multisafepay.module.js';
import { EmerchantpayModule } from '../emerchantpay/emerchantpay.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortalPaymentSessionEntity,
      PortalSessionAuditEntity,
      PSPEventInboxEntity,
    ]),
    StripeModule,
    GoCardlessModule,
    SlimpayModule,
    MultiSafepayModule,
    EmerchantpayModule,
  ],
  providers: [
    PortalSessionService,
    PortalPSPService,
    PortalQueryService,
  ],
  exports: [
    PortalSessionService,
    PortalPSPService,
    PortalQueryService,
  ],
})
export class PortalModule {}
