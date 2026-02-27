import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import { CfastConfigEntity } from './domain/cfast/entities/cfast-config.entity';
import { CfastEntityMappingEntity } from './domain/cfast/entities/cfast-entity-mapping.entity';

// Infrastructure services (TypeORM repositories)
import { CfastConfigService } from './infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastEntityMappingService } from './infrastructure/persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';

// External API client
import { CfastApiClient } from './infrastructure/external/cfast/cfast-api-client';

// Domain services
import { CfastImportService } from './domain/cfast/services/cfast-import.service';
import { ContractPdfGeneratorService } from './domain/cfast/services/contract-pdf-generator.service';

// Security
import { EncryptionService } from './infrastructure/security/encryption.service';

// gRPC controllers
import { CfastConfigController } from './infrastructure/grpc/subscriptions/cfast-config.controller';
import { CfastImportController } from './infrastructure/grpc/subscriptions/cfast-import.controller';

// HTTP controllers
import { CfastPdfController } from './infrastructure/http/cfast/cfast-pdf.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CfastConfigEntity, CfastEntityMappingEntity])],
  controllers: [CfastConfigController, CfastImportController, CfastPdfController],
  providers: [
    // TypeORM repository services
    CfastConfigService,
    CfastEntityMappingService,
    // External API client
    CfastApiClient,
    // Domain services
    CfastImportService,
    ContractPdfGeneratorService,
    // Security
    EncryptionService,
  ],
  exports: [CfastConfigService, CfastEntityMappingService, CfastApiClient],
})
export class CfastModule {}
