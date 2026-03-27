import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

interface ScoringServiceClient {
  PredictRisk(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class ScoringGrpcClient implements OnModuleInit {
  private logger = new Logger(ScoringGrpcClient.name);
  private scoringClient: ScoringServiceClient | null = null;

  constructor(@Inject('FINANCE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    try {
      this.scoringClient = this.client.getService<ScoringServiceClient>(
        'ScoringService',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown gRPC init error';
      this.logger.warn(
        `ScoringService unavailable at startup, endpoints may return 503: ${message}`,
      );
      this.scoringClient = null;
    }
  }

  predictRisk(data: Record<string, unknown>): Observable<unknown> {
    if (!this.scoringClient) {
      return throwError(
        () => new Error('ScoringService is unavailable on FINANCE_PACKAGE'),
      );
    }

    return wrapGrpcCall(
      this.scoringClient.PredictRisk(data),
      this.logger,
      'ScoringService',
      'PredictRisk',
    );
  }
}
