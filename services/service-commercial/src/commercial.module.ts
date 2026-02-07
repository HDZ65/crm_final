import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Domain entities
import {
  ApporteurEntity,
  StatutCommissionEntity,
  BaremeCommissionEntity,
  PalierCommissionEntity,
  BordereauCommissionEntity,
  LigneBordereauEntity,
  CommissionEntity,
  CommissionRecurrenteEntity,
  ReportNegatifEntity,
  RepriseCommissionEntity,
  CommissionAuditLogEntity,
  ContestationCommissionEntity,
  PartenaireCommercialEntity,
  PartenaireCommercialSocieteEntity,
} from './domain/commercial/entities';

// Infrastructure services
import {
  ApporteurService,
  CommissionService,
  BaremeService,
  PalierService,
  BordereauService,
  LigneBordereauService,
  RepriseService,
  StatutCommissionService,
  CommissionAuditLogService,
  CommissionRecurrenteService,
  ReportNegatifService,
  ContestationCommissionService,
  PartenaireCommercialService,
} from './infrastructure/persistence/typeorm/repositories/commercial';

// Interface controllers
import { ApporteurController, CommissionController } from './infrastructure/grpc/commercial';

// Cross-context dependencies
import { ContratsModule } from './contrats.module';
import { CommissionCalculationService } from './domain/commercial/services/commission-calculation.service';
import { RepriseCalculationService } from './domain/commercial/services/reprise-calculation.service';
import { RecurrenceGenerationService } from './domain/commercial/services/recurrence-generation.service';
import { ContestationWorkflowService } from './domain/commercial/services/contestation-workflow.service';
import { BordereauExportService } from './domain/commercial/services/bordereau-export.service';
import { BordereauFileStorageService } from './domain/commercial/services/bordereau-file-storage.service';
import { SnapshotKpiService } from './domain/commercial/services/snapshot-kpi.service';
import { GenererBordereauWorkflowService } from './domain/commercial/services/generer-bordereau-workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApporteurEntity,
      StatutCommissionEntity,
      BaremeCommissionEntity,
      PalierCommissionEntity,
      BordereauCommissionEntity,
      LigneBordereauEntity,
      CommissionEntity,
      CommissionRecurrenteEntity,
      ReportNegatifEntity,
      RepriseCommissionEntity,
      CommissionAuditLogEntity,
      ContestationCommissionEntity,
      PartenaireCommercialEntity,
      PartenaireCommercialSocieteEntity,
    ]),
    forwardRef(() => ContratsModule),
  ],
  controllers: [
    ApporteurController,
    CommissionController,
  ],
  providers: [
    ApporteurService,
    CommissionService,
    BaremeService,
    PalierService,
    BordereauService,
    LigneBordereauService,
    RepriseService,
    StatutCommissionService,
    CommissionAuditLogService,
    CommissionRecurrenteService,
    ReportNegatifService,
    ContestationCommissionService,
    PartenaireCommercialService,
    CommissionCalculationService,
    RepriseCalculationService,
    RecurrenceGenerationService,
    {
      provide: GenererBordereauWorkflowService,
      useFactory: (
        commissionService: CommissionService,
        baremeService: BaremeService,
        statutService: StatutCommissionService,
        repriseService: RepriseService,
        recurrenteService: CommissionRecurrenteService,
        reportNegatifService: ReportNegatifService,
        bordereauService: BordereauService,
        ligneBordereauService: LigneBordereauService,
        auditLogService: CommissionAuditLogService,
        commissionCalculationService: CommissionCalculationService,
        repriseCalculationService: RepriseCalculationService,
        recurrenceGenerationService: RecurrenceGenerationService,
      ) =>
        new GenererBordereauWorkflowService({
          findCommissionsForPeriode: async (input) => {
            const result = await commissionService.findAll(
              {
                organisationId: input.organisationId,
                apporteurId: input.apporteurId,
                periode: input.periode,
              },
              { page: 1, limit: 1000 },
            );
            return result.data as any;
          },
          findBaremeForCommission: async (commission) =>
            baremeService.findApplicable(
              commission.organisationId,
              commission.contratId,
              `${commission.periode}-01`,
            ) as any,
          calculerCommission: (contrat, bareme, montantBase) =>
            commissionCalculationService.calculer(contrat, bareme, montantBase),
          findStatutAPayer: async () => {
            try {
              return await statutService.findByCode('a_payer');
            } catch {
              return null;
            }
          },
          findReprisesForPeriode: async (input) => {
            const result = await repriseService.findAll(
              {
                organisationId: input.organisationId,
                apporteurId: input.apporteurId,
                periodeApplication: input.periode,
                statutReprise: 'en_attente',
              },
              { page: 1, limit: 1000 },
            );
            return result.data as any;
          },
          calculerReprise: (contratId, typeReprise, fenetreMois, periode) =>
            repriseCalculationService.calculerReprise(contratId, typeReprise, fenetreMois, periode),
          updateReprise: async (id, payload) => {
            await repriseService.update(id, payload as any);
          },
          findRecurrencesForPeriode: async (input) => {
            const result = await recurrenteService.findAll(
              {
                organisationId: input.organisationId,
                apporteurId: input.apporteurId,
                periode: input.periode,
                statutRecurrence: 'active',
              },
              { page: 1, limit: 1000 },
            );
            return result.data as any;
          },
          genererRecurrence: (contratId, echeanceId, dateEncaissement) =>
            recurrenceGenerationService.genererRecurrence(contratId, echeanceId, dateEncaissement),
          findReportsNegatifs: async (input) => {
            const result = await reportNegatifService.findAll(
              {
                organisationId: input.organisationId,
                apporteurId: input.apporteurId,
                statutReport: 'en_cours',
              },
              { page: 1, limit: 1000 },
            );
            return result.data.filter((report) => report.periodeOrigine < input.periode) as any;
          },
          createBordereau: async (input) =>
            bordereauService.create({
              organisationId: input.organisationId,
              apporteurId: input.apporteurId,
              periode: input.periode,
              reference: input.reference,
              creePar: input.creePar || null,
            }) as any,
          createLigne: async (payload) => ligneBordereauService.create(payload as any) as any,
          updateBordereau: async (id, payload) => bordereauService.update(id, payload as any),
          audit: async (payload) => {
            await auditLogService.create(payload as any);
          },
        }),
      inject: [
        CommissionService,
        BaremeService,
        StatutCommissionService,
        RepriseService,
        CommissionRecurrenteService,
        ReportNegatifService,
        BordereauService,
        LigneBordereauService,
        CommissionAuditLogService,
        CommissionCalculationService,
        RepriseCalculationService,
        RecurrenceGenerationService,
      ],
    },
    ContestationWorkflowService,
    BordereauExportService,
    BordereauFileStorageService,
    {
      provide: SnapshotKpiService,
      useFactory: (
        dataSource: DataSource,
        commissionRepository: any,
        repriseRepository: any,
        recurrenceRepository: any,
        bordereauRepository: any,
      ) => SnapshotKpiService.fromRepositories(
        dataSource,
        commissionRepository,
        repriseRepository,
        recurrenceRepository,
        bordereauRepository,
      ),
      inject: [
        DataSource,
        getRepositoryToken(CommissionEntity),
        getRepositoryToken(RepriseCommissionEntity),
        getRepositoryToken(CommissionRecurrenteEntity),
        getRepositoryToken(BordereauCommissionEntity),
      ],
    },
  ],
  exports: [
    ApporteurService,
    CommissionService,
    BaremeService,
    BordereauService,
    PartenaireCommercialService,
  ],
})
export class CommercialModule {}
