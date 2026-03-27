import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  ApplyOptimizationSuggestionRequest,
  ApplyOptimizationSuggestionResponse,
  ClientDebitConfiguration,
  DateShiftStrategy as ProtoDateShiftStrategy,
  DebitBatch as ProtoDebitBatch,
  DebitDateMode as ProtoDebitDateMode,
  GetOptimizationSuggestionsRequest,
  GetOptimizationSuggestionsResponse,
} from '@proto/calendar';
import { OptimizationSuggestionQueryService } from '../../../application/queries/optimization-suggestion-query.service';
import {
  ClientDebitConfigurationEntity,
  DateShiftStrategy,
  DebitBatch,
  DebitDateMode,
} from '../../../domain/calendar/entities';

@Controller()
export class OptimizationSuggestionController {
  constructor(
    private readonly optimizationQueryService: OptimizationSuggestionQueryService,
  ) {}

  @GrpcMethod('OptimizationSuggestionService', 'GetOptimizationSuggestions')
  async getOptimizationSuggestions(
    data: GetOptimizationSuggestionsRequest,
  ): Promise<GetOptimizationSuggestionsResponse> {
    const suggestions = await this.optimizationQueryService.getOptimizationSuggestions({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      analysisMonths: data.analysis_months || 6,
    });

    return {
      suggestions: suggestions.map((suggestion) => ({
        client_id: suggestion.clientId,
        client_name: suggestion.clientName,
        current_lot_id: suggestion.currentLotId,
        current_lot_name: suggestion.currentLotName,
        suggested_lot_id: suggestion.suggestedLotId,
        suggested_lot_name: suggestion.suggestedLotName,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        estimated_impact: suggestion.estimatedImpact,
      })),
    };
  }

  @GrpcMethod('OptimizationSuggestionService', 'ApplyOptimizationSuggestion')
  async applyOptimizationSuggestion(
    data: ApplyOptimizationSuggestionRequest,
  ): Promise<ApplyOptimizationSuggestionResponse> {
    const result = await this.optimizationQueryService.applyOptimizationSuggestion({
      organisationId: data.organisation_id,
      clientId: data.client_id,
      suggestedLotId: data.suggested_lot_id,
    });

    return {
      success: result.success,
      updated_config: this.toProtoClientConfig(result.updatedConfig),
    };
  }

  private toProtoClientConfig(config: ClientDebitConfigurationEntity): ClientDebitConfiguration {
    return {
      id: config.id,
      organisation_id: config.organisationId,
      client_id: config.clientId,
      mode: this.toProtoDebitDateMode(config.mode),
      batch: this.toProtoDebitBatch(config.batch),
      fixed_day: config.fixedDay || 0,
      shift_strategy: this.toProtoDateShiftStrategy(config.shiftStrategy),
      holiday_zone_id: config.holidayZoneId || '',
      is_active: config.isActive,
      created_at: config.createdAt?.toISOString?.() || '',
      updated_at: config.updatedAt?.toISOString?.() || '',
    };
  }

  private toProtoDebitDateMode(mode: DebitDateMode): ProtoDebitDateMode {
    switch (mode) {
      case DebitDateMode.FIXED_DAY:
        return ProtoDebitDateMode.DEBIT_DATE_MODE_FIXED_DAY;
      case DebitDateMode.BATCH:
        return ProtoDebitDateMode.DEBIT_DATE_MODE_BATCH;
      default:
        return ProtoDebitDateMode.DEBIT_DATE_MODE_UNSPECIFIED;
    }
  }

  private toProtoDebitBatch(batch: DebitBatch | undefined | null): ProtoDebitBatch {
    switch (batch) {
      case DebitBatch.L1:
        return ProtoDebitBatch.DEBIT_BATCH_L1;
      case DebitBatch.L2:
        return ProtoDebitBatch.DEBIT_BATCH_L2;
      case DebitBatch.L3:
        return ProtoDebitBatch.DEBIT_BATCH_L3;
      case DebitBatch.L4:
        return ProtoDebitBatch.DEBIT_BATCH_L4;
      default:
        return ProtoDebitBatch.DEBIT_BATCH_UNSPECIFIED;
    }
  }

  private toProtoDateShiftStrategy(strategy: DateShiftStrategy): ProtoDateShiftStrategy {
    switch (strategy) {
      case DateShiftStrategy.NEXT_BUSINESS_DAY:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY;
      case DateShiftStrategy.PREVIOUS_BUSINESS_DAY:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_PREVIOUS_BUSINESS_DAY;
      case DateShiftStrategy.NEXT_WEEK_SAME_DAY:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_WEEK_SAME_DAY;
      default:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_UNSPECIFIED;
    }
  }
}
