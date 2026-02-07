import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Domain entities
import {
  ConsentementEntity,
  AbonnementDepanssurEntity,
  OptionAbonnementEntity,
  CompteurPlafondEntity,
  HistoriqueStatutAbonnementEntity,
  DossierDeclaratifEntity,
  HistoriqueStatutDossierEntity,
  WebhookEventLogEntity,
} from './domain/depanssur/entities';

// Infrastructure services
import {
  AbonnementService,
  OptionAbonnementService,
  CompteurPlafondService,
  DossierDeclaratifService,
} from './infrastructure/persistence/typeorm/repositories/depanssur';
import { RegleDepanssurService } from './domain/depanssur/services/regle-depanssur.service';
import { DepanssurWebhookService } from './domain/depanssur/services/depanssur-webhook.service';
import { DepanssurSchedulerService } from './domain/depanssur/services/depanssur-scheduler.service';

// Interface controllers
import { DepanssurController } from './infrastructure/grpc/depanssur';
import { DepanssurWebhookController } from './infrastructure/http/controllers/depanssur-webhook.controller';

// Cross-context module imports
import { ClientsModule } from './clients.module';

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
    forwardRef(() => ClientsModule),
  ],
  controllers: [
    DepanssurController,
    DepanssurWebhookController,
  ],
  providers: [
    RegleDepanssurService,
    AbonnementService,
    OptionAbonnementService,
    CompteurPlafondService,
    DossierDeclaratifService,
    DepanssurWebhookService,
    DepanssurSchedulerService,
  ],
  exports: [
    RegleDepanssurService,
    AbonnementService,
    OptionAbonnementService,
    CompteurPlafondService,
    DossierDeclaratifService,
    DepanssurWebhookService,
  ],
})
export class DepanssurModule {}
