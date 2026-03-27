import { ClientDebitConfigurationEntity } from '../entities/client-debit-configuration.entity';

export interface OptimizationSuggestion {
  clientId: string;
  clientName: string;
  currentLotId: string;
  currentLotName: string;
  suggestedLotId: string;
  suggestedLotName: string;
  reason: string;
  confidence: number;
  estimatedImpact: string;
}

export interface GetOptimizationSuggestionsInput {
  organisationId: string;
  societeId: string;
  analysisMonths?: number;
}

export interface ApplyOptimizationSuggestionInput {
  organisationId: string;
  clientId: string;
  suggestedLotId: string;
}

export interface ApplyOptimizationSuggestionResult {
  success: boolean;
  updatedConfig: ClientDebitConfigurationEntity;
}

export interface IOptimizationSuggestionRepository {
  getOptimizationSuggestions(
    input: GetOptimizationSuggestionsInput,
  ): Promise<OptimizationSuggestion[]>;
  applyOptimizationSuggestion(
    input: ApplyOptimizationSuggestionInput,
  ): Promise<ApplyOptimizationSuggestionResult>;
}

export const I_OPTIMIZATION_SUGGESTION_REPOSITORY = Symbol('IOptimizationSuggestionRepository');
