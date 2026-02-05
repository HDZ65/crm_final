import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactureEntity } from '../facture/entities/facture.entity';
import { FactureSettingsEntity } from '../facture-settings/entities/facture-settings.entity';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';
import { FactureModule } from '../facture/facture.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FactureEntity, FactureSettingsEntity]),
    forwardRef(() => FactureModule),
  ],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
