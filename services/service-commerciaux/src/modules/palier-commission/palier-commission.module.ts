import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PalierCommission } from './entities/palier-commission.entity';
import { PalierCommissionService } from './palier-commission.service';
import { PalierCommissionController } from './palier-commission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PalierCommission])],
  controllers: [PalierCommissionController],
  providers: [PalierCommissionService],
  exports: [PalierCommissionService],
})
export class PalierCommissionModule {}
