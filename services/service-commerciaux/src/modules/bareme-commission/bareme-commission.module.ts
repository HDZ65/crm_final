import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaremeCommission } from './entities/bareme-commission.entity';
import { BaremeCommissionService } from './bareme-commission.service';

@Module({
  imports: [TypeOrmModule.forFeature([BaremeCommission])],
  providers: [BaremeCommissionService],
  exports: [BaremeCommissionService],
})
export class BaremeCommissionModule {}
