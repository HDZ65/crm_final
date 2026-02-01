import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaremeCommissionEntity } from './entities/bareme-commission.entity';
import { BaremeService } from './bareme.service';
import { BaremeController } from './bareme.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BaremeCommissionEntity])],
  controllers: [BaremeController],
  providers: [BaremeService],
  exports: [BaremeService],
})
export class BaremeModule {}
