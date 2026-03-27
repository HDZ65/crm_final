export interface RejectionTrendPoint {
  month: number;
  year: number;
  totalCount: number;
  rejectedCount: number;
  rejectionRate: number;
}

export interface DayHeatmapPoint {
  dayOfMonth: number;
  totalCount: number;
  rejectedCount: number;
  rejectionRate: number;
}

export type ClientScoreTrend = 'improving' | 'stable' | 'degrading';

export interface ClientScorePoint {
  clientId: string;
  clientName: string;
  totalPayments: number;
  rejectedCount: number;
  successRate: number;
  riskTier: string;
  trend: ClientScoreTrend;
}

export interface ForecastVsActualPoint {
  month: number;
  year: number;
  expectedCount: number;
  actualCount: number;
  expectedAmount: number;
  actualAmount: number;
}

export interface IAnalyticsAggregationRepository {
  getRejectionTrends(
    organisationId: string,
    societeId: string,
    monthsBack: number,
  ): Promise<RejectionTrendPoint[]>;

  getDayHeatmap(
    organisationId: string,
    societeId: string,
    monthsBack: number,
  ): Promise<DayHeatmapPoint[]>;

  getClientScores(
    organisationId: string,
    societeId: string,
    limit: number,
    sortBy: string,
  ): Promise<ClientScorePoint[]>;

  getForecastVsActual(
    organisationId: string,
    societeId: string,
    monthsBack: number,
  ): Promise<ForecastVsActualPoint[]>;
}
