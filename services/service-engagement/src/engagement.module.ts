import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities - Engagement
import {
  NotificationEntity,
  MailboxEntity,
  ActiviteEntity,
  TacheEntity,
  TypeActiviteEntity,
  EvenementSuiviEntity,
  OAuthConnectionEntity,
  CalendarEventEntity,
  MeetingEntity,
  CallSummaryEntity,
} from './domain/engagement/entities';

// Domain entities - Services
import {
  DemandeConciergerie,
  CommentaireDemande,
  CasJuridique,
  OperationCashback,
} from './domain/services/entities';

// Infrastructure services
import {
  NotificationService,
  MailboxService,
  ActiviteService,
  TacheService,
  TypeActiviteService,
  EvenementSuiviService,
  OAuthConnectionAgendaService,
  CalendarEventAgendaService,
  MeetingAgendaService,
  CallSummaryAgendaService,
} from './infrastructure/persistence/typeorm/repositories/engagement';

// Infrastructure common
import { EncryptionService } from './infrastructure/common/encryption.service';

// Infrastructure websocket
import { NotificationGateway } from './infrastructure/websocket/notification.gateway';

// Interface controllers
import {
  NotificationController,
  MailboxController,
  ActiviteController,
  TacheController,
  TypeActiviteController,
  EvenementSuiviController,
  OAuthConnectionController,
  CalendarEventController,
  MeetingController,
  CallSummaryController,
} from './infrastructure/grpc';

// Services controllers (Wincash)
import { WincashController } from './infrastructure/grpc/services/wincash.controller';

// Services controllers (Justi+)
import { JustiPlusController } from './infrastructure/grpc/justi-plus.controller';

// Services controllers (Conciergerie)
import { ConciergerieController } from './infrastructure/grpc/services/conciergerie.controller';

// External services
import { WincashService } from './infrastructure/external/wincash/wincash.service';
import { JustiPlusService } from './infrastructure/external/justi-plus/justi-plus.service';

// Services repositories
import { OperationCashbackService } from './infrastructure/persistence/typeorm/repositories/services/operation-cashback.service';
import { CasJuridiqueRepository } from './infrastructure/persistence/typeorm/repositories/services/cas-juridique.service';
import { DemandeConciergerieService } from './infrastructure/persistence/typeorm/repositories/services/demande-conciergerie.service';
import { CommentaireDemandeService } from './infrastructure/persistence/typeorm/repositories/services/commentaire-demande.service';

// NATS handlers (Wincash)
import {
  WincashCustomerHandler,
  WincashSubscriptionHandler,
  WincashCashbackHandler,
} from './infrastructure/messaging/nats/handlers';

// NATS handlers (Justi+)
import {
  JustiCustomerHandler,
  JustiSubscriptionHandler,
  JustiCaseHandler,
} from './infrastructure/messaging/nats/handlers';

// NATS handlers (Depanssur)
import { DepanssurEventsHandler } from './infrastructure/messaging/nats/handlers/depanssur-events.handler';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Engagement entities
      NotificationEntity,
      MailboxEntity,
      ActiviteEntity,
      TacheEntity,
      TypeActiviteEntity,
      EvenementSuiviEntity,
      OAuthConnectionEntity,
      CalendarEventEntity,
      MeetingEntity,
      CallSummaryEntity,
      // Services entities
      DemandeConciergerie,
      CommentaireDemande,
      CasJuridique,
      OperationCashback,
    ]),
  ],
  controllers: [
    NotificationController,
    MailboxController,
    ActiviteController,
    TacheController,
    TypeActiviteController,
    EvenementSuiviController,
    OAuthConnectionController,
    CalendarEventController,
    MeetingController,
    CallSummaryController,
    // Services
    WincashController,
    JustiPlusController,
    ConciergerieController,
  ],
  providers: [
    // Services
    NotificationService,
    MailboxService,
    ActiviteService,
    TacheService,
    TypeActiviteService,
    EvenementSuiviService,
    OAuthConnectionAgendaService,
    CalendarEventAgendaService,
    MeetingAgendaService,
    CallSummaryAgendaService,
    // Common
    EncryptionService,
    // WebSocket
    NotificationGateway,
    // Services - External
    WincashService,
    JustiPlusService,
    // Services - Repositories
    OperationCashbackService,
    CasJuridiqueRepository,
    DemandeConciergerieService,
    CommentaireDemandeService,
    // Services - NATS Handlers
    WincashCustomerHandler,
    WincashSubscriptionHandler,
    WincashCashbackHandler,
    JustiCustomerHandler,
    JustiSubscriptionHandler,
    JustiCaseHandler,
    DepanssurEventsHandler,
  ],
  exports: [
    NotificationService,
    MailboxService,
    ActiviteService,
    TacheService,
    TypeActiviteService,
    EvenementSuiviService,
    OAuthConnectionAgendaService,
    CalendarEventAgendaService,
    MeetingAgendaService,
    CallSummaryAgendaService,
    EncryptionService,
    NotificationGateway,
    // Services
    WincashService,
    JustiPlusService,
    OperationCashbackService,
    CasJuridiqueRepository,
    DemandeConciergerieService,
    CommentaireDemandeService,
  ],
})
export class EngagementModule {}
