import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PalierCommission } from './entities/palier-commission.entity';
import { PalierCommissionService } from './palier-commission.service';

@Module({
  imports: [TypeOrmModule.forFeature([PalierCommission])],
  providers: [PalierCommissionService],
  exports: [PalierCommissionService],
})
export class PalierCommissionModule {}
