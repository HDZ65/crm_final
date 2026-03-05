import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProvisioningLifecycleService } from '../../persistence/typeorm/repositories/provisioning';
import { ProvisioningSagaService } from '../../../domain/provisioning/services';
import { ProvisioningLifecycleEntity } from '../../../domain/provisioning/entities';
import type {
  ListProvisioningLifecyclesRequest,
  ListProvisioningLifecyclesResponse,
  GetProvisioningLifecycleRequest,
  GetProvisioningLifecycleResponse,
  GetProvisioningStatsRequest,
  GetProvisioningStatsResponse,
  RetryTransatelActivationRequest,
  RetryTransatelActivationResponse,
  RetrySepaMandateRequest,
  RetrySepaMandateResponse,
  ForceActiveRequest,
  ForceActiveResponse,
  TriggerRetractionDeadlineRequest,
  TriggerRetractionDeadlineResponse,
  CancelProvisioningRequest,
  CancelProvisioningResponse,
  ProvisioningLifecycle,
} from '../../../../../../packages/proto/gen/ts/telecom/telecom';

@Controller()
export class TelecomProvisioningController {
  constructor(
    private readonly repo: ProvisioningLifecycleService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  @GrpcMethod('TelecomProvisioningService', 'ListProvisioningLifecycles')
  async listProvisioningLifecycles(
    data: ListProvisioningLifecyclesRequest,
  ): Promise<ListProvisioningLifecyclesResponse> {
    const { items, total } = await this.repo.findByOrganisationId(
      data.organisation_id,
      {
        stateFilter: data.state_filter || undefined,
        search: data.search || undefined,
        page: data.page || 1,
        limit: data.limit || 20,
      },
    );
    return { items: items.map((e) => this.toProto(e)), total };
  }

  @GrpcMethod('TelecomProvisioningService', 'GetProvisioningLifecycle')
  async getProvisioningLifecycle(
    data: GetProvisioningLifecycleRequest,
  ): Promise<GetProvisioningLifecycleResponse> {
    const entity = await this.repo.findById(data.id);
    return { lifecycle: entity ? this.toProto(entity) : undefined };
  }

  @GrpcMethod('TelecomProvisioningService', 'GetProvisioningStats')
  async getProvisioningStats(
    data: GetProvisioningStatsRequest,
  ): Promise<GetProvisioningStatsResponse> {
    const stats = await this.repo.countByState(data.organisation_id);
    return {
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      en_attente: stats['EN_ATTENTE_RETRACTATION'] || 0,
      delai_ecoule: stats['DELAI_RETRACTATION_ECOULE'] || 0,
      en_cours: stats['EN_COURS'] || 0,
      active: stats['ACTIVE'] || 0,
      erreur: stats['ERREUR_TECHNIQUE'] || 0,
    };
  }

  @GrpcMethod('TelecomProvisioningService', 'RetryTransatelActivation')
  async retryTransatelActivation(
    data: RetryTransatelActivationRequest,
  ): Promise<RetryTransatelActivationResponse> {
    try {
      const entity = await this.repo.findById(data.id);
      if (!entity) {
        return { lifecycle: undefined, success: false, message: 'Lifecycle not found' };
      }
      const updated = await this.sagaService.retryTransatelActivation(entity.contratId);
      return { lifecycle: this.toProto(updated), success: true, message: '' };
    } catch (err: unknown) {
      return { lifecycle: undefined, success: false, message: (err as Error).message };
    }
  }

  @GrpcMethod('TelecomProvisioningService', 'RetrySepaMandate')
  async retrySepaMandate(
    data: RetrySepaMandateRequest,
  ): Promise<RetrySepaMandateResponse> {
    try {
      const entity = await this.repo.findById(data.id);
      if (!entity) {
        return { lifecycle: undefined, success: false, message: 'Lifecycle not found' };
      }
      const updated = await this.sagaService.retrySepaMandate(entity.contratId);
      return { lifecycle: this.toProto(updated), success: true, message: '' };
    } catch (err: unknown) {
      return { lifecycle: undefined, success: false, message: (err as Error).message };
    }
  }

  @GrpcMethod('TelecomProvisioningService', 'ForceActive')
  async forceActive(
    data: ForceActiveRequest,
  ): Promise<ForceActiveResponse> {
    try {
      const entity = await this.repo.findById(data.id);
      if (!entity) {
        return { lifecycle: undefined, success: false, message: 'Lifecycle not found' };
      }
      const updated = await this.sagaService.forceActive(entity.contratId);
      return { lifecycle: this.toProto(updated), success: true, message: '' };
    } catch (err: unknown) {
      return { lifecycle: undefined, success: false, message: (err as Error).message };
    }
  }

  @GrpcMethod('TelecomProvisioningService', 'TriggerRetractionDeadline')
  async triggerRetractionDeadline(
    data: TriggerRetractionDeadlineRequest,
  ): Promise<TriggerRetractionDeadlineResponse> {
    try {
      const entity = await this.repo.findById(data.id);
      if (!entity) {
        return { lifecycle: undefined, success: false, message: 'Lifecycle not found' };
      }
      const updated = await this.sagaService.triggerRetractionDeadline(entity.contratId);
      return { lifecycle: updated ? this.toProto(updated) : undefined, success: true, message: '' };
    } catch (err: unknown) {
      return { lifecycle: undefined, success: false, message: (err as Error).message };
    }
  }

  @GrpcMethod('TelecomProvisioningService', 'CancelProvisioning')
  async cancelProvisioning(
    data: CancelProvisioningRequest,
  ): Promise<CancelProvisioningResponse> {
    try {
      const entity = await this.repo.findById(data.id);
      if (!entity) {
        return { lifecycle: undefined, success: false, message: 'Lifecycle not found' };
      }
      const updated = await this.sagaService.cancelProvisioning(entity.contratId);
      return { lifecycle: this.toProto(updated), success: true, message: '' };
    } catch (err: unknown) {
      return { lifecycle: undefined, success: false, message: (err as Error).message };
    }
  }

  private toProto(entity: ProvisioningLifecycleEntity): ProvisioningLifecycle {
    return {
      id: entity.id,
      organisation_id: entity.organisationId || '',
      contrat_id: entity.contratId,
      client_id: entity.clientId,
      commercial_id: entity.commercialId || '',
      date_signature: entity.dateSignature?.toISOString() || '',
      date_fin_retractation: entity.dateFinRetractation?.toISOString() || '',
      abonnement_status: entity.abonnementStatus,
      provisioning_state: entity.provisioningState,
      montant_abonnement: Number(entity.montantAbonnement),
      devise: entity.devise,
      sepa_mandate_id: entity.sepaMandateId || '',
      gocardless_subscription_id: entity.gocardlessSubscriptionId || '',
      compensation_done: entity.compensationDone,
      last_error: entity.lastError || '',
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
      created_at: entity.createdAt?.toISOString() || '',
      updated_at: entity.updatedAt?.toISOString() || '',
    };
  }
}
