import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactureSettingsEntity } from './entities/facture-settings.entity';
import { FactureSettingsService } from './facture-settings.service';
import { FactureSettingsController } from './facture-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FactureSettingsEntity])],
  controllers: [FactureSettingsController],
  providers: [FactureSettingsService],
  exports: [FactureSettingsService],
})
export class FactureSettingsModule {}
