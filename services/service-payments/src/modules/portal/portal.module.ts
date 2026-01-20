import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalPaymentSessionEntity } from './entities/portal-session.entity.js';
import { PortalSessionAuditEntity } from './entities/portal-session-audit.entity.js';
import { PSPEventInboxEntity } from './entities/psp-event-inbox.entity.js';
import { PortalSessionService } from './portal-session.service.js';
import { PortalPSPService } from './portal-psp.service.js';
import { PortalQueryService } from './portal-query.service.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { GoCardlessModule } from '../gocardless/gocardless.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortalPaymentSessionEntity,
      PortalSessionAuditEntity,
      PSPEventInboxEntity,
    ]),
    StripeModule,
    GoCardlessModule,
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
