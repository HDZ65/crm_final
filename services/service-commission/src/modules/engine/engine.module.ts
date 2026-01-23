import { Module } from '@nestjs/common';
import { CommissionEngineService } from './commission-engine.service';
import { CommissionModule } from '../commission/commission.module';
import { BaremeModule } from '../bareme/bareme.module';
import { BordereauModule } from '../bordereau/bordereau.module';
import { LigneBordereauModule } from '../ligne-bordereau/ligne-bordereau.module';
import { RepriseModule } from '../reprise/reprise.module';
import { StatutModule } from '../statut/statut.module';
import { CommissionAuditModule } from '../audit/audit.module';
import { RecurrenceModule } from '../recurrence/recurrence.module';
import { ReportNegatifModule } from '../report/report.module';

@Module({
  imports: [
    CommissionModule,
    BaremeModule,
    BordereauModule,
    LigneBordereauModule,
    RepriseModule,
    StatutModule,
    CommissionAuditModule,
    RecurrenceModule,
    ReportNegatifModule,
  ],
  providers: [CommissionEngineService],
  exports: [CommissionEngineService],
})
export class EngineModule {}
