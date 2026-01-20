import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactureEntity } from '../facture/entities/facture.entity';
import { FactureSettingsEntity } from '../facture-settings/entities/facture-settings.entity';
import { GenerationService } from './generation.service';

@Module({
  imports: [TypeOrmModule.forFeature([FactureEntity, FactureSettingsEntity])],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
