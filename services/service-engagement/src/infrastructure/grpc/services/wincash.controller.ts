import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OperationCashbackService } from '../../persistence/typeorm/repositories/services/operation-cashback.service';
import { WincashService } from '../../external/wincash/wincash.service';
import { OperationCashback, CashbackStatut, CashbackType } from '../../../domain/services/entities/operation-cashback.entity';
import type {
  SyncCashbackRequest,
  SyncCashbackResponse,
  GetOperationRequest,
  GetOperationResponse,
  ListOperationsRequest,
  ListOperationsResponse,
  OperationCashbackProto,
} from '@proto/wincash';

@Controller()
export class WincashController {
  private readonly logger = new Logger(WincashController.name);

  constructor(
    private readonly operationCashbackService: OperationCashbackService,
    private readonly wincashService: WincashService,
  ) {}

  @GrpcMethod('WincashSvc', 'SyncCashback')
  async syncCashback(data: SyncCashbackRequest): Promise<SyncCashbackResponse> {
    this.logger.log(`SyncCashback called for org=${data.organisation_id}`);

    try {
      const result = await this.wincashService.syncCashbackOperations(
        data.organisation_id,
        data.client_id,
        data.since,
        data.force_full_sync,
      );

      return {
        operations_creees: result.operationsCreees,
        operations_mises_a_jour: result.operationsMisesAJour,
        operations_ignorees: result.operationsIgnorees,
        erreurs: result.erreurs,
        errors: result.errors.map((e) => ({
          reference_externe: e.referenceExterne,
          message: e.message,
          code: e.code,
        })),
        sync_id: result.syncId,
        synced_at: result.syncedAt.toISOString(),
      };
    } catch (error: any) {
      this.logger.error('SyncCashback failed', error.stack);
      throw error;
    }
  }

  @GrpcMethod('WincashSvc', 'GetOperation')
  async getOperation(data: GetOperationRequest): Promise<GetOperationResponse> {
    this.logger.debug(`GetOperation called for id=${data.id}`);

    const operation = await this.operationCashbackService.findById(data.id);
    return {
      operation: operation ? this.toProto(operation) : undefined,
    };
  }

  @GrpcMethod('WincashSvc', 'ListOperations')
  async listOperations(data: ListOperationsRequest): Promise<ListOperationsResponse> {
    this.logger.debug(`ListOperations called for org=${data.organisation_id}`);

    const result = await this.operationCashbackService.findAll(
      {
        organisationId: data.organisation_id,
        clientId: data.client_id,
        statut: data.statut !== undefined ? this.mapStatutFromProto(data.statut) : undefined,
        type: data.type !== undefined ? this.mapTypeFromProto(data.type) : undefined,
        search: data.search,
      },
      data.pagination ? { page: data.pagination.page, limit: data.pagination.limit } : undefined,
    );

    // Calculate summaries
    const allOps = result.data;
    const totalGains = allOps
      .filter((op) => op.type === CashbackType.ACHAT || op.type === CashbackType.FIDELITE || op.type === CashbackType.PARRAINAGE || op.type === CashbackType.PROMOTION)
      .reduce((sum, op) => sum + Number(op.montantCashback), 0);
    const totalUtilise = 0; // No 'utilisation' type in current entity
    const soldeDisponible = totalGains - totalUtilise;

    return {
      operations: result.data.map((op) => this.toProto(op)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
      total_gains: totalGains,
      total_utilise: totalUtilise,
      solde_disponible: soldeDisponible,
    };
  }

  // ========== MAPPERS ==========

  private toProto(entity: OperationCashback): OperationCashbackProto {
    return {
      id: entity.id,
      organisation_id: entity.organisationId,
      client_id: entity.clientId,
      contrat_id: '',
      reference_externe: entity.reference,
      type: this.mapTypeToProto(entity.type),
      statut: this.mapStatutToProto(entity.statut),
      montant: Number(entity.montantCashback),
      devise: 'EUR',
      description: entity.description ?? '',
      date_operation: entity.dateAchat?.toISOString() ?? '',
      date_validation: entity.dateValidation?.toISOString() ?? '',
      date_versement: entity.dateVersement?.toISOString() ?? '',
      date_expiration: '',
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
      synced_at: '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }

  private mapStatutToProto(statut: CashbackStatut): number {
    switch (statut) {
      case CashbackStatut.EN_ATTENTE: return 1;
      case CashbackStatut.VALIDEE: return 2;
      case CashbackStatut.REJETEE: return 3;
      case CashbackStatut.VERSEE: return 4;
      case CashbackStatut.ANNULEE: return 5;
      default: return 0;
    }
  }

  private mapStatutFromProto(statut: number): CashbackStatut | undefined {
    switch (statut) {
      case 1: return CashbackStatut.EN_ATTENTE;
      case 2: return CashbackStatut.VALIDEE;
      case 3: return CashbackStatut.REJETEE;
      case 4: return CashbackStatut.VERSEE;
      case 5: return CashbackStatut.ANNULEE;
      default: return undefined;
    }
  }

  private mapTypeToProto(type: CashbackType): number {
    switch (type) {
      case CashbackType.ACHAT: return 1;
      case CashbackType.PARRAINAGE: return 2;
      case CashbackType.FIDELITE: return 3;
      case CashbackType.PROMOTION: return 5;
      case CashbackType.AUTRE: return 3;
      default: return 0;
    }
  }

  private mapTypeFromProto(type: number): CashbackType | undefined {
    switch (type) {
      case 1: return CashbackType.ACHAT;
      case 2: return CashbackType.PARRAINAGE;
      case 3: return CashbackType.FIDELITE;
      case 5: return CashbackType.PROMOTION;
      default: return undefined;
    }
  }
}
