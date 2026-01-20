import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeleDistribution } from './entities/modele-distribution.entity';
import { ModeleDistributionService } from './modele-distribution.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModeleDistribution])],
  providers: [ModeleDistributionService],
  exports: [ModeleDistributionService],
})
export class ModeleDistributionModule {}
