import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportNegatifEntity } from './entities/report-negatif.entity';
import { ReportNegatifService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReportNegatifEntity])],
  providers: [ReportNegatifService],
  exports: [ReportNegatifService],
})
export class ReportNegatifModule {}
