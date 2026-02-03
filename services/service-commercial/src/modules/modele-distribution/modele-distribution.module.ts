import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeleDistribution } from './entities/modele-distribution.entity';
import { ModeleDistributionService } from './modele-distribution.service';
import { ModeleDistributionController } from './modele-distribution.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModeleDistribution])],
  controllers: [ModeleDistributionController],
  providers: [ModeleDistributionService],
  exports: [ModeleDistributionService],
})
export class ModeleDistributionModule {}
