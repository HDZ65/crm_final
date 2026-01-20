import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PalierCommissionEntity } from './entities/palier-commission.entity';
import { PalierService } from './palier.service';

@Module({
  imports: [TypeOrmModule.forFeature([PalierCommissionEntity])],
  providers: [PalierService],
  exports: [PalierService],
})
export class PalierModule {}
