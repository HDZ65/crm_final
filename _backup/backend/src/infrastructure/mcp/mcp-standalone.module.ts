// src/infrastructure/mcp/mcp-standalone.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpService } from './mcp.service';
import { McpGrpcService } from '../grpc/mcp-grpc.service';

// Import ALL entities to avoid metadata issues
import { ClientBaseEntity } from '../db/entities/client-base.entity';
import { ClientEntrepriseEntity } from '../db/entities/client-entreprise.entity';
import { RoleEntity } from '../db/entities/role.entity';
import { UtilisateurEntity } from '../db/entities/utilisateur.entity';
import { BoiteMailEntity } from '../db/entities/boite-mail.entity';
import { ProduitEntity } from '../db/entities/produit.entity';
import { ClientPartenaireEntity } from '../db/entities/client-partenaire.entity';
import { StatutContratEntity } from '../db/entities/statut-contrat.entity';
import { ConditionPaiementEntity } from '../db/entities/condition-paiement.entity';
import { TypeActiviteEntity } from '../db/entities/type-activite.entity';
import { ContratEntity } from '../db/entities/contrat.entity';
import { LigneContratEntity } from '../db/entities/ligne-contrat.entity';
import { ActiviteEntity } from '../db/entities/activite.entity';
import { AdresseEntity } from '../db/entities/adresse.entity';
import { HistoriqueStatutContratEntity } from '../db/entities/historique-statut-contrat.entity';
import { PieceJointeEntity } from '../db/entities/piece-jointe.entity';
import { StatutFactureEntity } from '../db/entities/statut-facture.entity';
import { EmissionFactureEntity } from '../db/entities/emission-facture.entity';
import { FactureEntity } from '../db/entities/facture.entity';
import { StatutPartenaireEntity } from '../db/entities/statut-partenaire.entity';
import { ModeleDistributionEntity } from '../db/entities/modele-distribution.entity';
import { FacturationParEntity } from '../db/entities/facturation-par.entity';
import { PeriodeFacturationEntity } from '../db/entities/periode-facturation.entity';
import { RolePartenaireEntity } from '../db/entities/role-partenaire.entity';
import { StatutClientEntity } from '../db/entities/statut-client.entity';
import { PartenaireMarqueBlancheEntity } from '../db/entities/partenaire-marque-blanche.entity';
import { ThemeMarqueEntity } from '../db/entities/theme-marque.entity';
import { GrilleTarifaireEntity } from '../db/entities/grille-tarifaire.entity';
import { PrixProduitEntity } from '../db/entities/prix-produit.entity';
import { MembrePartenaireEntity } from '../db/entities/membre-partenaire.entity';
import { CompteEntity } from '../db/entities/compte.entity';
import { PermissionEntity } from '../db/entities/permission.entity';
import { RolePermissionEntity } from '../db/entities/role-permission.entity';
import { MembreOrganisationEntity } from '../db/entities/membre-compte.entity';
import { InvitationCompteEntity } from '../db/entities/invitation-compte.entity';
import { SocieteEntity } from '../db/entities/societe.entity';
import { TransporteurCompteEntity } from '../db/entities/transporteur-compte.entity';
import { ExpeditionEntity } from '../db/entities/expedition.entity';
import { ColisEntity } from '../db/entities/colis.entity';
import { EvenementSuiviEntity } from '../db/entities/evenement-suivi.entity';
import { ContractOrchestrationHistoryEntity } from '../db/entities/contract-orchestration-history.entity';

// UseCases
import { CreateClientBaseUseCase } from '../../applications/usecase/client-base/create-client-base.usecase';
import { GetClientBaseUseCase } from '../../applications/usecase/client-base/get-client-base.usecase';
import { UpdateClientBaseUseCase } from '../../applications/usecase/client-base/update-client-base.usecase';
import { DeleteClientBaseUseCase } from '../../applications/usecase/client-base/delete-client-base.usecase';
import { TypeOrmClientBaseRepository } from '../repositories/typeorm-client-base.repository';

import { CreateContratUseCase } from '../../applications/usecase/contrat/create-contrat.usecase';
import { GetContratUseCase } from '../../applications/usecase/contrat/get-contrat.usecase';
import { UpdateContratUseCase } from '../../applications/usecase/contrat/update-contrat.usecase';
import { DeleteContratUseCase } from '../../applications/usecase/contrat/delete-contrat.usecase';
import { TypeOrmContratRepository } from '../repositories/typeorm-contrat.repository';

import { CreateFactureUseCase } from '../../applications/usecase/facture/create-facture.usecase';
import { GetFactureUseCase } from '../../applications/usecase/facture/get-facture.usecase';
import { UpdateFactureUseCase } from '../../applications/usecase/facture/update-facture.usecase';
import { DeleteFactureUseCase } from '../../applications/usecase/facture/delete-facture.usecase';
import { TypeOrmFactureRepository } from '../repositories/typeorm-facture.repository';

import { CreateActiviteUseCase } from '../../applications/usecase/activite/create-activite.usecase';
import { GetActiviteUseCase } from '../../applications/usecase/activite/get-activite.usecase';
import { UpdateActiviteUseCase } from '../../applications/usecase/activite/update-activite.usecase';
import { DeleteActiviteUseCase } from '../../applications/usecase/activite/delete-activite.usecase';
import { TypeOrmActiviteRepository } from '../repositories/typeorm-activite.repository';

const TYPEORM_ENTITIES = [
  ClientBaseEntity,
  ClientEntrepriseEntity,
  RoleEntity,
  UtilisateurEntity,
  BoiteMailEntity,
  ProduitEntity,
  ClientPartenaireEntity,
  StatutContratEntity,
  ConditionPaiementEntity,
  TypeActiviteEntity,
  ContratEntity,
  LigneContratEntity,
  ActiviteEntity,
  AdresseEntity,
  HistoriqueStatutContratEntity,
  PieceJointeEntity,
  StatutFactureEntity,
  EmissionFactureEntity,
  FactureEntity,
  StatutPartenaireEntity,
  ModeleDistributionEntity,
  FacturationParEntity,
  PeriodeFacturationEntity,
  RolePartenaireEntity,
  StatutClientEntity,
  PartenaireMarqueBlancheEntity,
  ThemeMarqueEntity,
  GrilleTarifaireEntity,
  PrixProduitEntity,
  MembrePartenaireEntity,
  CompteEntity,
  PermissionEntity,
  RolePermissionEntity,
  MembreOrganisationEntity,
  InvitationCompteEntity,
  SocieteEntity,
  TransporteurCompteEntity,
  ExpeditionEntity,
  ColisEntity,
  EvenementSuiviEntity,
  ContractOrchestrationHistoryEntity,
];

/**
 * Module MCP autonome avec configuration TypeORM intégrée.
 * Utilisé pour le serveur gRPC MCP standalone (sans dépendances LLM).
 */
@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.mcp.example'],
    }),

    // Configuration TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'backend_db'),
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),

    // Enregistrement de toutes les entités
    TypeOrmModule.forFeature(TYPEORM_ENTITIES),
  ],
  providers: [
    McpService,
    McpGrpcService,

    // ClientBase
    {
      provide: 'ClientBaseRepositoryPort',
      useClass: TypeOrmClientBaseRepository,
    },
    CreateClientBaseUseCase,
    GetClientBaseUseCase,
    UpdateClientBaseUseCase,
    DeleteClientBaseUseCase,

    // Contrat
    { provide: 'ContratRepositoryPort', useClass: TypeOrmContratRepository },
    CreateContratUseCase,
    GetContratUseCase,
    UpdateContratUseCase,
    DeleteContratUseCase,

    // Facture
    { provide: 'FactureRepositoryPort', useClass: TypeOrmFactureRepository },
    CreateFactureUseCase,
    GetFactureUseCase,
    UpdateFactureUseCase,
    DeleteFactureUseCase,

    // Activite
    { provide: 'ActiviteRepositoryPort', useClass: TypeOrmActiviteRepository },
    CreateActiviteUseCase,
    GetActiviteUseCase,
    UpdateActiviteUseCase,
    DeleteActiviteUseCase,
  ],
  exports: [McpService, McpGrpcService],
})
export class McpStandaloneModule {}
