import {
  BadRequestException,
  Controller,
} from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateProviderOverrideRequest,
  CreateReassignmentJobRequest,
  CreateRoutingRuleRequest,
  DeleteProviderOverrideRequest,
  DeleteProviderOverrideResponse,
  DeleteRoutingRuleRequest,
  DeleteRoutingRuleResponse,
  GetReassignmentJobRequest,
  ListProviderOverridesRequest,
  ListProviderOverridesResponse,
  ListRoutingRulesRequest,
  ListRoutingRulesResponse,
  ProviderOverrideResponse,
  ReassignmentJobResponse,
  RoutingRuleEvaluation,
  RoutingRuleResponse,
  TestRoutingRuleRequest,
  TestRoutingRuleResponse,
  UpdateRoutingRuleRequest,
} from '@proto/payment';
import {
  OverrideScope,
  ProviderOverrideEntity,
  ProviderReassignmentJobEntity,
  ProviderRoutingRuleEntity,
} from '../../../../domain/payments/entities';
import { ProviderOverrideService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/provider-override.service';
import { ReassignmentJobService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/reassignment-job.service';
import { RoutingEngineService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/routing-engine.service';

@Controller()
export class RoutingController {
  constructor(
    @InjectRepository(ProviderRoutingRuleEntity)
    private readonly routingRuleRepository: Repository<ProviderRoutingRuleEntity>,
    private readonly routingEngineService: RoutingEngineService,
    private readonly providerOverrideService: ProviderOverrideService,
    private readonly reassignmentJobService: ReassignmentJobService,
  ) {}

  @GrpcMethod('PaymentService', 'CreateRoutingRule')
  async createRoutingRule(
    data: CreateRoutingRuleRequest,
  ): Promise<RoutingRuleResponse> {
    const rule = this.routingRuleRepository.create({
      companyId: data.societe_id,
      name: data.name,
      priority: data.priority,
      conditions: this.parseJsonObject(data.conditions),
      providerAccountId: data.provider_account_id,
      fallback: data.is_fallback,
      isEnabled: data.is_enabled,
    });

    const savedRule = await this.routingRuleRepository.save(rule);
    return this.toRoutingRuleResponse(savedRule);
  }

  @GrpcMethod('PaymentService', 'UpdateRoutingRule')
  async updateRoutingRule(
    data: UpdateRoutingRuleRequest,
  ): Promise<RoutingRuleResponse> {
    const rule = await this.routingRuleRepository.findOne({
      where: { id: data.id },
    });

    if (!rule) {
      throw new BadRequestException(`Routing rule ${data.id} not found`);
    }

    if (data.name !== undefined) {
      rule.name = data.name;
    }
    if (data.priority !== undefined) {
      rule.priority = data.priority;
    }
    if (data.conditions !== undefined) {
      rule.conditions = this.parseJsonObject(data.conditions);
    }
    if (data.provider_account_id !== undefined) {
      rule.providerAccountId = data.provider_account_id;
    }
    if (data.is_fallback !== undefined) {
      rule.fallback = data.is_fallback;
    }
    if (data.is_enabled !== undefined) {
      rule.isEnabled = data.is_enabled;
    }

    const savedRule = await this.routingRuleRepository.save(rule);
    return this.toRoutingRuleResponse(savedRule);
  }

  @GrpcMethod('PaymentService', 'DeleteRoutingRule')
  async deleteRoutingRule(
    data: DeleteRoutingRuleRequest,
  ): Promise<DeleteRoutingRuleResponse> {
    const result = await this.routingRuleRepository.delete({
      id: data.id,
      companyId: data.societe_id,
    });

    return {
      success: (result.affected ?? 0) > 0,
      message: (result.affected ?? 0) > 0 ? 'Routing rule deleted' : 'Routing rule not found',
    };
  }

  @GrpcMethod('PaymentService', 'ListRoutingRules')
  async listRoutingRules(
    data: ListRoutingRulesRequest,
  ): Promise<ListRoutingRulesResponse> {
    const page = data.page && data.page > 0 ? data.page : 1;
    const pageSize = data.page_size && data.page_size > 0 ? data.page_size : 50;
    const where: Partial<ProviderRoutingRuleEntity> = {
      companyId: data.societe_id,
    };

    if (data.is_enabled !== undefined) {
      where.isEnabled = data.is_enabled;
    }

    const [rules, total] = await this.routingRuleRepository.findAndCount({
      where,
      order: { priority: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      rules: rules.map((rule) => this.toRoutingRuleResponse(rule)),
      total,
      page,
      page_size: pageSize,
    };
  }

  @GrpcMethod('PaymentService', 'TestRoutingRule')
  async testRoutingRule(
    data: TestRoutingRuleRequest,
  ): Promise<TestRoutingRuleResponse> {
    const testPayload: Record<string, any> = {
      source_channel: data.source_channel,
      product_code: data.product_code,
      contract_age_months: data.contract_age_months,
      amount_cents: data.amount_cents,
      client_id: data.client_id,
    };

    const result = await this.routingEngineService.testRouting(
      testPayload,
      data.societe_id,
    );

    return {
      matched_rule_id: result.matchedRule?.id || '',
      matched_rule_name: result.matchedRule?.name || '',
      provider_account_id: result.matchedRule?.providerAccountId || '',
      provider_name: '',
      is_fallback: result.matchedBy === 'FALLBACK',
      evaluations: result.evaluations.map((evaluation) =>
        this.toRoutingRuleEvaluation(evaluation),
      ),
    };
  }

  @GrpcMethod('PaymentService', 'CreateProviderOverride')
  async createProviderOverride(
    data: CreateProviderOverrideRequest,
  ): Promise<ProviderOverrideResponse> {
    const override = await this.providerOverrideService.createOverride({
      companyId: data.societe_id,
      scope: this.toOverrideScope(data.scope),
      scopeId: data.scope_id,
      providerAccountId: data.provider_account_id,
      reason: data.reason,
    });

    return this.toProviderOverrideResponse(override, data.societe_id);
  }

  @GrpcMethod('PaymentService', 'DeleteProviderOverride')
  async deleteProviderOverride(
    data: DeleteProviderOverrideRequest,
  ): Promise<DeleteProviderOverrideResponse> {
    await this.providerOverrideService.deleteOverride(data.id);

    return {
      success: true,
      message: 'Provider override deleted',
    };
  }

  @GrpcMethod('PaymentService', 'ListProviderOverrides')
  async listProviderOverrides(
    data: ListProviderOverridesRequest,
  ): Promise<ListProviderOverridesResponse> {
    const page = data.page && data.page > 0 ? data.page : 1;
    const pageSize = data.page_size && data.page_size > 0 ? data.page_size : 50;

    let overrides = await this.providerOverrideService.listOverrides(data.societe_id);

    if (data.scope) {
      const scope = this.toOverrideScope(data.scope);
      overrides = overrides.filter((override) => override.scope === scope);
    }

    if (data.scope_id) {
      overrides = overrides.filter((override) => override.scopeId === data.scope_id);
    }

    const total = overrides.length;
    const paginatedOverrides = overrides.slice(
      (page - 1) * pageSize,
      page * pageSize,
    );

    return {
      overrides: paginatedOverrides.map((override) =>
        this.toProviderOverrideResponse(override, data.societe_id),
      ),
      total,
      page,
      page_size: pageSize,
    };
  }

  @GrpcMethod('PaymentService', 'CreateReassignmentJob')
  async createReassignmentJob(
    data: CreateReassignmentJobRequest,
  ): Promise<ReassignmentJobResponse> {
    const selectionQuery = this.parseJsonObject(data.selection_query);

    if (data.scheduled_at) {
      selectionQuery.__scheduled_at = data.scheduled_at;
    }

    const job = await this.reassignmentJobService.createJob({
      companyId: data.societe_id,
      fromProviderAccountId: data.from_provider_account_id,
      toProviderAccountId: data.to_provider_account_id,
      selectionQuery,
      dryRun: data.dry_run,
    });

    if (!data.scheduled_at) {
      await this.reassignmentJobService.executeJob(job.id);
    }

    const persistedJob = await this.reassignmentJobService.getJob(job.id);
    return this.toReassignmentJobResponse(persistedJob);
  }

  @GrpcMethod('PaymentService', 'GetReassignmentJob')
  async getReassignmentJob(
    data: GetReassignmentJobRequest,
  ): Promise<ReassignmentJobResponse> {
    const job = await this.reassignmentJobService.getJob(data.id);

    if (job.companyId !== data.societe_id) {
      throw new BadRequestException(`Reassignment job ${data.id} does not belong to company ${data.societe_id}`);
    }

    return this.toReassignmentJobResponse(job);
  }

  private parseJsonObject(rawJson: string): Record<string, any> {
    if (!rawJson || rawJson.trim().length === 0) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new BadRequestException('JSON payload must be an object');
      }
      return parsed as Record<string, any>;
    } catch (error) {
      throw new BadRequestException(
        `Invalid JSON payload: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private toOverrideScope(scope: string): OverrideScope {
    const normalizedScope = scope.trim().toUpperCase();

    if (normalizedScope === OverrideScope.CLIENT) {
      return OverrideScope.CLIENT;
    }

    if (normalizedScope === OverrideScope.CONTRAT) {
      return OverrideScope.CONTRAT;
    }

    throw new BadRequestException(`Invalid override scope: ${scope}`);
  }

  private toRoutingRuleResponse(
    rule: ProviderRoutingRuleEntity,
  ): RoutingRuleResponse {
    return {
      id: rule.id,
      societe_id: rule.companyId,
      name: rule.name,
      priority: rule.priority,
      conditions: JSON.stringify(rule.conditions ?? {}),
      provider_account_id: rule.providerAccountId,
      is_fallback: rule.fallback,
      is_enabled: rule.isEnabled,
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
    };
  }

  private toProviderOverrideResponse(
    override: ProviderOverrideEntity,
    companyId: string,
  ): ProviderOverrideResponse {
    return {
      id: override.id,
      societe_id: companyId,
      scope: override.scope,
      scope_id: override.scopeId,
      provider_account_id: override.providerAccountId,
      reason: override.reason || '',
      created_by: override.createdBy || '',
      created_at: override.createdAt.toISOString(),
    };
  }

  private toReassignmentJobResponse(
    job: ProviderReassignmentJobEntity,
  ): ReassignmentJobResponse {
    const scheduledAt =
      typeof job.selectionQuery?.__scheduled_at === 'string'
        ? job.selectionQuery.__scheduled_at
        : undefined;
    const startedAt =
      job.status === 'RUNNING' ||
      job.status === 'DONE' ||
      job.status === 'FAILED' ||
      job.status === 'CANCELLED'
        ? job.createdAt.toISOString()
        : undefined;
    const completedAt = job.isComplete() ? job.updatedAt.toISOString() : undefined;

    return {
      id: job.id,
      societe_id: job.companyId,
      from_provider_account_id: job.fromProviderAccountId,
      to_provider_account_id: job.toProviderAccountId,
      selection_query: JSON.stringify(job.selectionQuery ?? {}),
      status: job.status,
      dry_run: job.dryRun,
      scheduled_at: scheduledAt,
      started_at: startedAt,
      completed_at: completedAt,
      total_items: job.totalCount,
      success_count: job.processedCount,
      failed_count: job.errorCount,
      report_file_id: job.reportFileId ?? undefined,
      created_at: job.createdAt.toISOString(),
      updated_at: job.updatedAt.toISOString(),
    };
  }

  private toRoutingRuleEvaluation(evaluation: {
    ruleId: string;
    ruleName: string;
    priority: number;
    matched: boolean;
    reason?: string;
  }): RoutingRuleEvaluation {
    return {
      rule_id: evaluation.ruleId,
      rule_name: evaluation.ruleName,
      priority: evaluation.priority,
      matched: evaluation.matched,
      reason: evaluation.reason,
    };
  }
}
