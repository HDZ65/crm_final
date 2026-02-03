import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportNegatifEntity } from './entities/report-negatif.entity';
import { ReportNegatifService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReportNegatifEntity])],
  controllers: [ReportController],
  providers: [ReportNegatifService],
  exports: [ReportNegatifService],
})
export class ReportNegatifModule {}
