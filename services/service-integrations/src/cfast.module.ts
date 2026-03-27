import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import { CfastConfigEntity } from './domain/cfast/entities/cfast-config.entity';
import { CfastEntityMappingEntity } from './domain/cfast/entities/cfast-entity-mapping.entity';
// Domain services
import { CfastClientPushService } from './domain/cfast/services/cfast-client-push.service';
import { CfastContractPushService } from './domain/cfast/services/cfast-contract-push.service';
import { CfastImportService } from './domain/cfast/services/cfast-import.service';
import { CfastSubscriptionPushService } from './domain/cfast/services/cfast-subscription-push.service';
import { ContractPdfGeneratorService } from './domain/cfast/services/contract-pdf-generator.service';
// Contrats entities
import { ContratEntity } from './domain/contrats/entities/contrat.entity';
// External infrastructure
import { CfastApiClient } from './infrastructure/external/cfast/cfast-api-client';
// Infrastructure services
import { CfastConfigService } from './infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastEntityMappingService } from './infrastructure/persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CfastConfigEntity, CfastEntityMappingEntity, ContratEntity]),
  ],
  controllers: [],
  providers: [
    CfastConfigService,
    CfastEntityMappingService,
    CfastApiClient,
    CfastClientPushService,
    CfastContractPushService,
    CfastImportService,
    CfastSubscriptionPushService,
    ContractPdfGeneratorService,
  ],
  exports: [
    CfastConfigService,
    CfastEntityMappingService,
    CfastApiClient,
    CfastClientPushService,
    CfastContractPushService,
    CfastImportService,
    CfastSubscriptionPushService,
    ContractPdfGeneratorService,
  ],
})
export class CfastModule {}
