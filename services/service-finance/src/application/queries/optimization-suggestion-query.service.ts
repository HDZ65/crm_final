import { Inject, Injectable } from '@nestjs/common';
import {
  ApplyOptimizationSuggestionInput,
  ApplyOptimizationSuggestionResult,
  GetOptimizationSuggestionsInput,
  I_OPTIMIZATION_SUGGESTION_REPOSITORY,
  OptimizationSuggestion,
} from '../../domain/calendar/repositories/IOptimizationSuggestionRepository';
import type { IOptimizationSuggestionRepository } from '../../domain/calendar/repositories/IOptimizationSuggestionRepository';

@Injectable()
export class OptimizationSuggestionQueryService {
  constructor(
    @Inject(I_OPTIMIZATION_SUGGESTION_REPOSITORY)
    private readonly optimizationRepository: IOptimizationSuggestionRepository,
  ) {}

  getOptimizationSuggestions(
    input: GetOptimizationSuggestionsInput,
  ): Promise<OptimizationSuggestion[]> {
    return this.optimizationRepository.getOptimizationSuggestions({
      ...input,
      analysisMonths: input.analysisMonths ?? 6,
    });
  }

  applyOptimizationSuggestion(
    input: ApplyOptimizationSuggestionInput,
  ): Promise<ApplyOptimizationSuggestionResult> {
    return this.optimizationRepository.applyOptimizationSuggestion(input);
  }
}
