import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  GetRejectionTrendsRequest,
  GetRejectionTrendsResponse,
  GetDayHeatmapRequest,
  GetDayHeatmapResponse,
  GetClientScoresRequest,
  GetClientScoresResponse,
  GetForecastVsActualRequest,
  GetForecastVsActualResponse,
} from '@proto/calendar';
import { AnalyticsAggregationService } from '../../persistence/typeorm/repositories/calendar/analytics-aggregation.service';

@Controller()
export class AnalyticsController {
  constructor(
    private readonly analyticsAggregationService: AnalyticsAggregationService,
  ) {}

  @GrpcMethod('CalendarAnalyticsService', 'GetRejectionTrends')
  async getRejectionTrends(
    data: GetRejectionTrendsRequest,
  ): Promise<GetRejectionTrendsResponse> {
    const points = await this.analyticsAggregationService.getRejectionTrends(
      data.organisation_id,
      data.societe_id,
      data.months_back,
    );

    return {
      entries: points.map((point) => ({
        month: point.month,
        year: point.year,
        total_count: point.totalCount,
        rejected_count: point.rejectedCount,
        rejection_rate: point.rejectionRate,
      })),
    };
  }

  @GrpcMethod('CalendarAnalyticsService', 'GetDayHeatmap')
  async getDayHeatmap(data: GetDayHeatmapRequest): Promise<GetDayHeatmapResponse> {
    const points = await this.analyticsAggregationService.getDayHeatmap(
      data.organisation_id,
      data.societe_id,
      data.months_back,
    );

    return {
      entries: points.map((point) => ({
        day_of_month: point.dayOfMonth,
        total_count: point.totalCount,
        rejected_count: point.rejectedCount,
        rejection_rate: point.rejectionRate,
      })),
    };
  }

  @GrpcMethod('CalendarAnalyticsService', 'GetClientScores')
  async getClientScores(data: GetClientScoresRequest): Promise<GetClientScoresResponse> {
    const points = await this.analyticsAggregationService.getClientScores(
      data.organisation_id,
      data.societe_id,
      data.limit,
      data.sort_by,
    );

    return {
      entries: points.map((point) => ({
        client_id: point.clientId,
        client_name: point.clientName,
        total_payments: point.totalPayments,
        rejected_count: point.rejectedCount,
        success_rate: point.successRate,
        risk_tier: point.riskTier,
        trend: point.trend,
      })),
    };
  }

  @GrpcMethod('CalendarAnalyticsService', 'GetForecastVsActual')
  async getForecastVsActual(
    data: GetForecastVsActualRequest,
  ): Promise<GetForecastVsActualResponse> {
    const points = await this.analyticsAggregationService.getForecastVsActual(
      data.organisation_id,
      data.societe_id,
      data.months_back,
    );

    return {
      entries: points.map((point) => ({
        month: point.month,
        year: point.year,
        expected_count: point.expectedCount,
        actual_count: point.actualCount,
        expected_amount: point.expectedAmount,
        actual_amount: point.actualAmount,
      })),
    };
  }
}
