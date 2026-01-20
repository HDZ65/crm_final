import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactureSettingsEntity } from './entities/facture-settings.entity';
import { FactureSettingsService } from './facture-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([FactureSettingsEntity])],
  providers: [FactureSettingsService],
  exports: [FactureSettingsService],
})
export class FactureSettingsModule {}
