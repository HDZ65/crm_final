import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RetryPolicyService } from './retry-policy.service';
import { validate, RetryPolicyValidation } from '../common/validation.pipe';

@Controller()
export class RetryPolicyController {
  constructor(private readonly policyService: RetryPolicyService) {}

  @GrpcMethod('RetryAdminService', 'GetRetryPolicy')
  async getRetryPolicy(data: { id: string }) {
    const policy = await this.policyService.findById(data.id);
    return { policy };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryPolicies')
  async listRetryPolicies(data: {
    organisation_id: string;
    societe_id?: string;
    active_only?: boolean;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.policyService.findAll({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      activeOnly: data.active_only,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      policies: result.policies,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RetryAdminService', 'CreateRetryPolicy')
  async createRetryPolicy(data: {
    organisation_id: string;
    societe_id?: string;
    product_id?: string;
    channel_id?: string;
    name: string;
    description?: string;
    retry_delays_days: number[];
    max_attempts: number;
    max_total_days: number;
    retry_on_am04: boolean;
    retryable_codes?: string[];
    non_retryable_codes?: string[];
    stop_on_payment_settled: boolean;
    stop_on_contract_cancelled: boolean;
    stop_on_mandate_revoked: boolean;
    backoff_strategy?: string;
    is_default?: boolean;
    priority?: number;
  }) {
    validate(data as unknown as Record<string, unknown>, RetryPolicyValidation);
    
    const policy = await this.policyService.create({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      productId: data.product_id,
      channelId: data.channel_id,
      name: data.name,
      description: data.description,
      retryDelaysDays: data.retry_delays_days,
      maxAttempts: data.max_attempts,
      maxTotalDays: data.max_total_days,
      retryOnAm04: data.retry_on_am04,
      retryableCodes: data.retryable_codes,
      nonRetryableCodes: data.non_retryable_codes,
      stopOnPaymentSettled: data.stop_on_payment_settled,
      stopOnContractCancelled: data.stop_on_contract_cancelled,
      stopOnMandateRevoked: data.stop_on_mandate_revoked,
      backoffStrategy: data.backoff_strategy,
      isDefault: data.is_default,
      priority: data.priority,
    });
    return { policy };
  }

  @GrpcMethod('RetryAdminService', 'UpdateRetryPolicy')
  async updateRetryPolicy(data: {
    id: string;
    name?: string;
    description?: string;
    retry_delays_days?: number[];
    max_attempts?: number;
    max_total_days?: number;
    retry_on_am04?: boolean;
    retryable_codes?: string[];
    non_retryable_codes?: string[];
    stop_on_payment_settled?: boolean;
    stop_on_contract_cancelled?: boolean;
    stop_on_mandate_revoked?: boolean;
    backoff_strategy?: string;
    is_active?: boolean;
    is_default?: boolean;
    priority?: number;
  }) {
    const policy = await this.policyService.update({
      id: data.id,
      name: data.name,
      description: data.description,
      retryDelaysDays: data.retry_delays_days,
      maxAttempts: data.max_attempts,
      maxTotalDays: data.max_total_days,
      retryOnAm04: data.retry_on_am04,
      retryableCodes: data.retryable_codes,
      nonRetryableCodes: data.non_retryable_codes,
      stopOnPaymentSettled: data.stop_on_payment_settled,
      stopOnContractCancelled: data.stop_on_contract_cancelled,
      stopOnMandateRevoked: data.stop_on_mandate_revoked,
      backoffStrategy: data.backoff_strategy,
      isActive: data.is_active,
      isDefault: data.is_default,
      priority: data.priority,
    });
    return { policy };
  }

  @GrpcMethod('RetryAdminService', 'DeleteRetryPolicy')
  async deleteRetryPolicy(data: { id: string }) {
    const success = await this.policyService.delete(data.id);
    return { success, message: success ? 'Policy deleted' : 'Policy not found' };
  }
}
