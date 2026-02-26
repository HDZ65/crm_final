import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import { CfastConfigEntity } from './domain/cfast/entities/cfast-config.entity';

// Infrastructure services (TypeORM repositories)
import { CfastConfigService } from './infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';

// External API client
import { CfastApiClient } from './infrastructure/external/cfast/cfast-api-client';

// Domain services
import { CfastImportService } from './domain/cfast/services/cfast-import.service';

// Security
import { EncryptionService } from './infrastructure/security/encryption.service';

// gRPC controllers
import { CfastConfigController } from './infrastructure/grpc/subscriptions/cfast-config.controller';
import { CfastImportController } from './infrastructure/grpc/subscriptions/cfast-import.controller';

// HTTP controllers
import { CfastPdfController } from './infrastructure/http/cfast/cfast-pdf.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CfastConfigEntity])],
  controllers: [CfastConfigController, CfastImportController, CfastPdfController],
  providers: [
    // TypeORM repository services
    CfastConfigService,
    // External API client
    CfastApiClient,
    // Domain services
    CfastImportService,
    // Security
    EncryptionService,
  ],
  exports: [CfastConfigService, CfastApiClient],
})
export class CfastModule {}
