import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controller
import { FactureSettingsController } from '../http/facture-settings.controller';

// Entity
import { FactureSettingsEntity } from '../../../db/entities/facture-settings.entity';

// Use Cases
import {
  CreateFactureSettingsUseCase,
  GetFactureSettingsUseCase,
  UpdateFactureSettingsUseCase,
  DeleteFactureSettingsUseCase,
} from '../../../../applications/usecase/facture-settings';

// Repository
import { TypeOrmFactureSettingsRepository } from '../../../repositories/typeorm-facture-settings.repository';

// Mapper
import { FactureSettingsMapper } from '../../../../applications/mapper/facture-settings.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([FactureSettingsEntity])],
  controllers: [FactureSettingsController],
  providers: [
    // Mapper
    FactureSettingsMapper,
    // Use Cases
    CreateFactureSettingsUseCase,
    GetFactureSettingsUseCase,
    UpdateFactureSettingsUseCase,
    DeleteFactureSettingsUseCase,
    // Repository
    {
      provide: 'FactureSettingsRepositoryPort',
      useClass: TypeOrmFactureSettingsRepository,
    },
  ],
  exports: [
    FactureSettingsMapper,
    GetFactureSettingsUseCase,
    'FactureSettingsRepositoryPort',
  ],
})
export class FactureSettingsModule {}
