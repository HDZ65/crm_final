import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
// Cross-context module imports (no circular dependency)
import { ClientsModule } from './clients.module';
// Domain entities
import {
  AbonnementDepanssurEntity,
  CompteurPlafondEntity,
  ConsentementEntity,
  DossierDeclaratifEntity,
  HistoriqueStatutAbonnementEntity,
  HistoriqueStatutDossierEntity,
  OptionAbonnementEntity,
  WebhookEventLogEntity,
} from './domain/depanssur/entities';
import { DepanssurSchedulerService } from './domain/depanssur/services/depanssur-scheduler.service';
import { DepanssurWebhookService } from './domain/depanssur/services/depanssur-webhook.service';
import { RegleDepanssurService } from './domain/depanssur/services/regle-depanssur.service';
// Interface controllers
import { DepanssurController } from './infrastructure/grpc/depanssur';
import { DepanssurWebhookController } from './infrastructure/http/controllers/depanssur-webhook.controller';
import { AbonnementRestoredHandler } from './infrastructure/messaging/nats/handlers/depanssur/abonnement-restored.handler';
// Infrastructure services
import {
  AbonnementService,
  CompteurPlafondService,
  ConsentementService,
  DossierDeclaratifService,
  OptionAbonnementService,
} from './infrastructure/persistence/typeorm/repositories/depanssur';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsentementEntity,
      AbonnementDepanssurEntity,
      OptionAbonnementEntity,
      CompteurPlafondEntity,
      HistoriqueStatutAbonnementEntity,
      DossierDeclaratifEntity,
      HistoriqueStatutDossierEntity,
      WebhookEventLogEntity,
    ]),
    ScheduleModule.forRoot(),
    // No forwardRef needed - ClientsModule doesn't import DepanssurModule
    ClientsModule,
  ],
  controllers: [DepanssurController, DepanssurWebhookController],
  providers: [
    RegleDepanssurService,
    AbonnementService,
    OptionAbonnementService,
    CompteurPlafondService,
    DossierDeclaratifService,
    DepanssurWebhookService,
    DepanssurSchedulerService,
    ConsentementService,
    AbonnementRestoredHandler,
  ],
  exports: [
    RegleDepanssurService,
    AbonnementService,
    OptionAbonnementService,
    CompteurPlafondService,
    DossierDeclaratifService,
    DepanssurWebhookService,
    ConsentementService,
  ],
})
export class DepanssurModule {}
