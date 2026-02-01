import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaremeCommission } from './entities/bareme-commission.entity';
import { BaremeCommissionService } from './bareme-commission.service';
import { BaremeCommissionController } from './bareme-commission.controller';
import { PalierCommissionModule } from '../palier-commission/palier-commission.module';

@Module({
  imports: [TypeOrmModule.forFeature([BaremeCommission]), PalierCommissionModule],
  controllers: [BaremeCommissionController],
  providers: [BaremeCommissionService],
  exports: [BaremeCommissionService],
})
export class BaremeCommissionModule {}
