import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaremeCommissionEntity } from './entities/bareme-commission.entity';
import { BaremeService } from './bareme.service';

@Module({
  imports: [TypeOrmModule.forFeature([BaremeCommissionEntity])],
  providers: [BaremeService],
  exports: [BaremeService],
})
export class BaremeModule {}
