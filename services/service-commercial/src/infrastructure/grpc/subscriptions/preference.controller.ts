import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionPreferenceSchemaService } from '../../persistence/typeorm/repositories/subscriptions/subscription-preference-schema.service';
import { SubscriptionPreferenceService } from '../../persistence/typeorm/repositories/subscriptions/subscription-preference.service';
import { SubscriptionPreferenceHistoryService } from '../../persistence/typeorm/repositories/subscriptions/subscription-preference-history.service';
import { SubscriptionService } from '../../persistence/typeorm/repositories/subscriptions/subscription.service';
import { PreferenceValidationService } from '../../../domain/subscriptions/services/preference-validation.service';
import {
  PreferenceCutoffService,
  CutoffConfig,
} from '../../../domain/subscriptions/services/preference-cutoff.service';
import { AppliedCycle } from '../../../domain/subscriptions/entities/subscription-preference-history.entity';

/** Default cut-off: Friday 17:00 Europe/Paris */
const DEFAULT_CUTOFF_CONFIG: CutoffConfig = {
  dayOfWeek: 5, // Friday
  hour: 17, // 5 PM
  timezone: 'Europe/Paris',
};

@Controller()
export class SubscriptionPreferenceController {
  private readonly logger = new Logger(SubscriptionPreferenceController.name);

  constructor(
    private readonly schemaService: SubscriptionPreferenceSchemaService,
    private readonly preferenceService: SubscriptionPreferenceService,
    private readonly historyService: SubscriptionPreferenceHistoryService,
    private readonly subscriptionService: SubscriptionService,
    private readonly validationService: PreferenceValidationService,
    private readonly cutoffService: PreferenceCutoffService,
  ) {}

  // ─── Schema endpoints ───

  @GrpcMethod('SubscriptionPreferenceSchemaService', 'Upsert')
  async upsertSchema(data: {
    organisation_id: string;
    code: string;
    label: string;
    value_type?: string;
    allowed_values?: string[];
    is_required?: boolean;
    default_value?: string;
    sort_order?: number;
    active?: boolean;
  }) {
    if (!data.organisation_id || !data.code || !data.label) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id, code, and label are required',
      });
    }

    const schema = await this.schemaService.upsert({
      organisationId: data.organisation_id,
      code: data.code,
      label: data.label,
      valueType: data.value_type,
      allowedValues: data.allowed_values,
      isRequired: data.is_required,
      defaultValue: data.default_value,
      sortOrder: data.sort_order,
      active: data.active,
    });

    return this.mapSchemaToResponse(schema);
  }

  @GrpcMethod('SubscriptionPreferenceSchemaService', 'Get')
  async getSchema(data: { id: string }) {
    const schema = await this.schemaService.findById(data.id);
    if (!schema) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Schema ${data.id} not found`,
      });
    }
    return this.mapSchemaToResponse(schema);
  }

  @GrpcMethod('SubscriptionPreferenceSchemaService', 'List')
  async listSchemas(data: { organisation_id: string }) {
    const schemas = await this.schemaService.findByOrganisation(data.organisation_id);
    return { schemas: schemas.map((s) => this.mapSchemaToResponse(s)) };
  }

  @GrpcMethod('SubscriptionPreferenceSchemaService', 'Delete')
  async deleteSchema(data: { id: string }) {
    await this.schemaService.delete(data.id);
    return { success: true };
  }

  // ─── Preference endpoints ───

  @GrpcMethod('SubscriptionPreferenceService', 'Set')
  async setPreference(data: {
    organisation_id: string;
    subscription_id: string;
    preferences: Array<{ code: string; value: any }>;
    changed_by?: string;
  }) {
    if (!data.organisation_id || !data.subscription_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id and subscription_id are required',
      });
    }

    if (!data.preferences?.length) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'At least one preference is required',
      });
    }

    // 1. Get active schemas for org
    const schemas = await this.schemaService.findActiveByOrganisation(data.organisation_id);

    // 2. Build values map
    const values: Record<string, any> = {};
    for (const pref of data.preferences) {
      values[pref.code] = pref.value;
    }

    // 3. Validate values against schemas
    const validation = this.validationService.validateAgainstSchema(values, schemas);
    if (!validation.valid) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Preference validation failed: ${validation.errors.join('; ')}`,
      });
    }

    // 4. Determine which cycle this change applies to
    const subscription = await this.subscriptionService.findById(data.subscription_id);
    let appliedCycleValue: string = AppliedCycle.CURRENT;

    if (subscription) {
      const currentCycle = {
        cycleStart: subscription.currentPeriodStart || new Date(),
        cycleEnd: subscription.currentPeriodEnd || new Date(),
      };

      const appliesFromCycle = this.cutoffService.getAppliesFromCycleNumber(
        new Date(),
        DEFAULT_CUTOFF_CONFIG,
        currentCycle,
        1, // TODO: Get actual current cycle number from subscription cycles
      );

      appliedCycleValue = appliesFromCycle > 1 ? AppliedCycle.NEXT : AppliedCycle.CURRENT;
      this.logger.log(
        `Preference change for subscription ${data.subscription_id} applies to cycle: ${appliedCycleValue}`,
      );
    }

    // 5. Save each preference + create history
    const saved = [];
    for (const pref of data.preferences) {
      const schema = schemas.find((s) => s.code === pref.code);
      if (!schema) continue;

      // Get existing preference for history tracking
      const existing = await this.preferenceService.findBySubscriptionAndSchema(
        data.subscription_id,
        schema.id,
      );
      const oldValue = existing?.value ?? null;

      const entity = await this.preferenceService.set({
        organisationId: data.organisation_id,
        subscriptionId: data.subscription_id,
        schemaId: schema.id,
        value: String(pref.value),
      });

      // Create history entry with cut-off cycle information
      await this.historyService.create({
        preferenceId: entity.id,
        oldValue,
        newValue: String(pref.value),
        changedBy: data.changed_by || 'system',
        appliedCycle: appliedCycleValue,
      });

      saved.push(entity);
    }

    return {
      preferences: saved.map((p) => this.mapPreferenceToResponse(p)),
    };
  }

  @GrpcMethod('SubscriptionPreferenceService', 'Get')
  async getPreference(data: { subscription_id: string }) {
    const preferences = await this.preferenceService.findBySubscription(data.subscription_id);
    return {
      preferences: preferences.map((p) => this.mapPreferenceToResponse(p)),
    };
  }

  @GrpcMethod('SubscriptionPreferenceService', 'GetHistory')
  async getHistory(data: { subscription_id: string }) {
    const history = await this.historyService.findBySubscription(data.subscription_id);
    return {
      history: history.map((h) => ({
        id: h.id,
        preference_id: h.preferenceId,
        old_value: h.oldValue,
        new_value: h.newValue,
        changed_at: h.changedAt?.toISOString(),
        changed_by: h.changedBy,
        applied_cycle: h.appliedCycle,
      })),
    };
  }

  @GrpcMethod('SubscriptionPreferenceService', 'Delete')
  async deletePreference(data: { id: string }) {
    await this.preferenceService.delete(data.id);
    return { success: true };
  }

  // ─── Mappers ───

  private mapSchemaToResponse(schema: any) {
    return {
      id: schema.id,
      organisation_id: schema.organisationId,
      code: schema.code,
      label: schema.label,
      value_type: schema.valueType,
      allowed_values: schema.allowedValues,
      is_required: schema.isRequired,
      default_value: schema.defaultValue,
      sort_order: schema.sortOrder,
      active: schema.active,
      created_at: schema.createdAt?.toISOString(),
      updated_at: schema.updatedAt?.toISOString(),
    };
  }

  private mapPreferenceToResponse(pref: any) {
    return {
      id: pref.id,
      organisation_id: pref.organisationId,
      subscription_id: pref.subscriptionId,
      schema_id: pref.schemaId,
      value: pref.value,
      effective_from: pref.effectiveFrom?.toISOString(),
      effective_to: pref.effectiveTo?.toISOString(),
      schema: pref.schema ? this.mapSchemaToResponse(pref.schema) : undefined,
    };
  }
}
