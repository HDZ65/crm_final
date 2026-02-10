import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertEntity,
  AlertScope,
  AlertSeverity,
  OverrideScope,
  PaymentEventEntity,
  PaymentEventType,
  ProviderRoutingRuleEntity,
} from '../../../../../domain/payments/entities';
import { ProviderOverrideService } from './provider-override.service';

export interface RoutingEvaluationResult {
  ruleId: string;
  ruleName: string;
  priority: number;
  matched: boolean;
  reason?: string;
}

export interface TestRoutingResult {
  matchedRule: ProviderRoutingRuleEntity | null;
  matchedBy: 'OVERRIDE' | 'RULE' | 'FALLBACK' | 'NONE';
  explanation: string;
  evaluations: RoutingEvaluationResult[];
}

@Injectable()
export class RoutingEngineService {
  private readonly logger = new Logger(RoutingEngineService.name);

  constructor(
    @InjectRepository(ProviderRoutingRuleEntity)
    private readonly ruleRepository: Repository<ProviderRoutingRuleEntity>,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
    private readonly providerOverrideService: ProviderOverrideService,
  ) {}

  async evaluateRouting(
    payment: Record<string, any>,
    companyId: string,
  ): Promise<ProviderRoutingRuleEntity | null> {
    const result = await this.evaluateInternal(payment, companyId);

    if (!result.matchedRule) {
      await this.createRoutingNotFoundAlert(companyId, payment);
    }

    await this.logRoutingDecision(companyId, payment, result.matchedRule, result.matchedBy);
    return result.matchedRule;
  }

  async testRouting(
    payment: Record<string, any>,
    companyId: string,
  ): Promise<TestRoutingResult> {
    return this.evaluateInternal(payment, companyId);
  }

  private async evaluateInternal(
    payment: Record<string, any>,
    companyId: string,
  ): Promise<TestRoutingResult> {
    const evaluations: RoutingEvaluationResult[] = [];

    const override = await this.resolveOverride(payment);
    if (override) {
      const overrideRule = this.ruleRepository.create({
        id: override.id,
        companyId,
        name: `Override ${override.scope}`,
        priority: 0,
        conditions: { override: true, scope: override.scope, scope_id: override.scopeId },
        providerAccountId: override.providerAccountId,
        fallback: false,
        isEnabled: true,
        createdAt: override.createdAt,
        updatedAt: override.updatedAt,
      });

      evaluations.push({
        ruleId: override.id,
        ruleName: `Override ${override.scope}`,
        priority: 0,
        matched: true,
        reason: `Override applied on ${override.scope}=${override.scopeId}`,
      });

      return {
        matchedRule: overrideRule,
        matchedBy: 'OVERRIDE',
        explanation: `Provider override matched on ${override.scope}`,
        evaluations,
      };
    }

    const rules = await this.ruleRepository.find({
      where: { companyId, isEnabled: true },
      order: { priority: 'ASC', createdAt: 'ASC' },
    });

    const primaryRules = rules.filter((rule) => !rule.fallback);
    const fallbackRule = rules.find((rule) => rule.fallback) ?? null;

    for (const rule of primaryRules) {
      const evaluation = this.evaluateRuleConditions(rule, payment);
      evaluations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        matched: evaluation.matched,
        reason: evaluation.reason,
      });

      if (evaluation.matched) {
        return {
          matchedRule: rule,
          matchedBy: 'RULE',
          explanation: `Rule \"${rule.name}\" matched by priority`,
          evaluations,
        };
      }
    }

    if (fallbackRule) {
      evaluations.push({
        ruleId: fallbackRule.id,
        ruleName: fallbackRule.name,
        priority: fallbackRule.priority,
        matched: true,
        reason: 'No priority rule matched, fallback selected',
      });

      return {
        matchedRule: fallbackRule,
        matchedBy: 'FALLBACK',
        explanation: `Fallback rule \"${fallbackRule.name}\" selected`,
        evaluations,
      };
    }

    return {
      matchedRule: null,
      matchedBy: 'NONE',
      explanation: 'No rule or fallback matched',
      evaluations,
    };
  }

  private async resolveOverride(payment: Record<string, any>) {
    const contractId = this.extractString(payment, [
      'contrat_id',
      'contract_id',
      'contratId',
      'contractId',
      'contract.id',
    ]);

    if (contractId) {
      const contractOverride = await this.providerOverrideService.getOverride(
        OverrideScope.CONTRAT,
        contractId,
      );
      if (contractOverride) {
        return contractOverride;
      }
    }

    const clientId = this.extractString(payment, [
      'client_id',
      'clientId',
      'client.id',
    ]);

    if (clientId) {
      return this.providerOverrideService.getOverride(OverrideScope.CLIENT, clientId);
    }

    return null;
  }

  private evaluateRuleConditions(
    rule: ProviderRoutingRuleEntity,
    payment: Record<string, any>,
  ): { matched: boolean; reason?: string } {
    const conditions = rule.conditions ?? {};
    const failures: string[] = [];

    const sourceChannel = this.extractString(payment, [
      'source_channel',
      'sourceChannel',
      'contract.source_channel',
      'contract.sourceChannel',
    ]);

    if (conditions.source_channel !== undefined) {
      const acceptedChannels = this.toStringArray(conditions.source_channel);
      if (!sourceChannel || !this.matchStringList(sourceChannel, acceptedChannels)) {
        failures.push(`source_channel must be one of [${acceptedChannels.join(', ')}]`);
      }
    }

    if (conditions.contract_age_months_gte !== undefined) {
      const expectedMonths = Number(conditions.contract_age_months_gte);
      const contractAgeMonths = this.resolveContractAgeMonths(payment);

      if (!Number.isFinite(expectedMonths)) {
        failures.push('contract_age_months_gte must be a number');
      } else if (contractAgeMonths === null) {
        failures.push('contract start_date is missing');
      } else if (contractAgeMonths < expectedMonths) {
        failures.push(`contract age ${contractAgeMonths} < required ${expectedMonths}`);
      }
    }

    if (conditions.product_code !== undefined) {
      const productCode = this.extractString(payment, [
        'product_code',
        'productCode',
        'contract.product_code',
        'contract.productCode',
      ]);
      const acceptedProducts = this.toStringArray(conditions.product_code);

      if (!productCode || !this.matchStringList(productCode, acceptedProducts)) {
        failures.push(`product_code must be one of [${acceptedProducts.join(', ')}]`);
      }
    }

    if (conditions.debit_lot_code_in !== undefined) {
      const debitLotCode = this.extractString(payment, [
        'debit_lot_code',
        'debitLotCode',
        'metadata.debit_lot_code',
        'metadata.debitLotCode',
      ]);
      const acceptedLots = this.toStringArray(conditions.debit_lot_code_in);

      if (!debitLotCode || !this.matchStringList(debitLotCode, acceptedLots)) {
        failures.push(`debit_lot_code must be one of [${acceptedLots.join(', ')}]`);
      }
    }

    if (conditions.preferred_debit_day_in !== undefined) {
      const preferredDebitDay = this.resolvePreferredDebitDay(payment);
      const acceptedDays = this.toNumberArray(conditions.preferred_debit_day_in);

      if (preferredDebitDay === null || !acceptedDays.includes(preferredDebitDay)) {
        failures.push(`preferred_debit_day must be one of [${acceptedDays.join(', ')}]`);
      }
    }

    if (conditions.risk_tier !== undefined) {
      const riskTier = this.extractString(payment, [
        'risk_tier',
        'riskTier',
        'risk_score_tier',
        'riskScoreTier',
        'risk_score.risk_tier',
        'riskScore.riskTier',
      ]);
      const acceptedTiers = this.toStringArray(conditions.risk_tier);

      if (!riskTier || !this.matchStringList(riskTier, acceptedTiers)) {
        failures.push(`risk_tier must be one of [${acceptedTiers.join(', ')}]`);
      }
    }

    if (failures.length > 0) {
      return {
        matched: false,
        reason: failures.join('; '),
      };
    }

    return { matched: true, reason: 'All conditions matched' };
  }

  private resolveContractAgeMonths(payment: Record<string, any>): number | null {
    const explicitAge = this.extractNumber(payment, [
      'contract_age_months',
      'contractAgeMonths',
    ]);

    if (explicitAge !== null) {
      return explicitAge;
    }

    const startDateValue = this.extractValue(payment, [
      'contract.start_date',
      'contract.startDate',
      'contract_start_date',
      'contractStartDate',
      'start_date',
      'startDate',
    ]);

    const startDate = this.toDate(startDateValue);
    if (!startDate) {
      return null;
    }

    const now = new Date();
    let months =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());

    if (now.getDate() < startDate.getDate()) {
      months -= 1;
    }

    return Math.max(0, months);
  }

  private resolvePreferredDebitDay(payment: Record<string, any>): number | null {
    const explicitDay = this.extractNumber(payment, [
      'preferred_debit_day',
      'preferredDebitDay',
      'metadata.preferred_debit_day',
      'metadata.preferredDebitDay',
    ]);

    if (explicitDay !== null) {
      return explicitDay;
    }

    const plannedDateValue = this.extractValue(payment, [
      'planned_debit_date',
      'plannedDebitDate',
      'metadata.planned_debit_date',
      'metadata.plannedDebitDate',
    ]);

    const plannedDate = this.toDate(plannedDateValue);
    if (!plannedDate) {
      return null;
    }

    return plannedDate.getDate();
  }

  private async createRoutingNotFoundAlert(
    companyId: string,
    payment: Record<string, any>,
  ): Promise<void> {
    const paymentReference = this.extractString(payment, [
      'id',
      'payment_id',
      'paymentId',
      'payment_intent_id',
      'paymentIntentId',
    ]);

    const alert = this.alertRepository.create({
      scope: AlertScope.PROVIDER,
      scopeRef: companyId,
      severity: AlertSeverity.WARNING,
      code: 'PROVIDER_ROUTING_NOT_FOUND',
      message: paymentReference
        ? `No routing rule matched for payment ${paymentReference}`
        : 'No routing rule matched for payment',
      notifiedChannels: [],
    });

    await this.alertRepository.save(alert);
  }

  private async logRoutingDecision(
    companyId: string,
    payment: Record<string, any>,
    matchedRule: ProviderRoutingRuleEntity | null,
    matchedBy: TestRoutingResult['matchedBy'],
  ): Promise<void> {
    const paymentIntentId =
      this.extractString(payment, ['payment_intent_id', 'paymentIntentId', 'id']) ||
      undefined;
    const scheduleId = this.extractString(payment, ['schedule_id', 'scheduleId']) || undefined;

    const payload = {
      event: 'ROUTING_DECISION',
      payload_in: payment,
      payload_out: matchedRule
        ? {
            matched_by: matchedBy,
            rule_id: matchedRule.id,
            rule_name: matchedRule.name,
            provider_account_id: matchedRule.providerAccountId,
            fallback: matchedRule.fallback,
          }
        : {
            matched_by: matchedBy,
            rule_id: null,
            provider_account_id: null,
            fallback: false,
          },
    };

    const event = this.paymentEventRepository.create({
      paymentIntentId: paymentIntentId ?? null,
      scheduleId: scheduleId ?? null,
      societeId: companyId,
      eventType: PaymentEventType.PAYMENT_PROCESSING,
      payload: { ...payload, originalEventType: 'routing.decision' },
      processed: true,
    } as any);

    try {
      await this.paymentEventRepository.save(event);
    } catch (error) {
      this.logger.warn('Routing decision type not available in enum, falling back to PAYMENT_PROCESSING log');
      const fallbackEvent = this.paymentEventRepository.create({
        paymentIntentId,
        scheduleId,
        societeId: companyId,
        eventType: PaymentEventType.PAYMENT_PROCESSING,
        payload,
        processed: true,
      });
      await this.paymentEventRepository.save(fallbackEvent);
    }
  }

  private extractValue(source: Record<string, any>, paths: string[]): any {
    for (const path of paths) {
      const segments = path.split('.');
      let current: any = source;

      for (const segment of segments) {
        if (current === null || current === undefined) {
          current = undefined;
          break;
        }
        current = current[segment];
      }

      if (current !== undefined && current !== null) {
        return current;
      }
    }

    return undefined;
  }

  private extractString(source: Record<string, any>, paths: string[]): string | null {
    const value = this.extractValue(source, paths);

    if (value === undefined || value === null) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private extractNumber(source: Record<string, any>, paths: string[]): number | null {
    const value = this.extractValue(source, paths);
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
    }

    if (value === undefined || value === null || value === '') {
      return [];
    }

    return [String(value).trim()].filter((item) => item.length > 0);
  }

  private toNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? [parsed] : [];
    }

    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  private matchStringList(actual: string, expectedValues: string[]): boolean {
    const normalizedActual = actual.trim().toUpperCase();
    return expectedValues.some((value) => value.trim().toUpperCase() === normalizedActual);
  }

  private toDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
