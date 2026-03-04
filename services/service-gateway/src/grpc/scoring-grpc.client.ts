import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

interface ScoringServiceClient {
  PredictRisk(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class ScoringGrpcClient implements OnModuleInit {
  private logger = new Logger(ScoringGrpcClient.name);
  private scoringClient: ScoringServiceClient;

  constructor(@Inject('FINANCE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.scoringClient = this.client.getService<ScoringServiceClient>(
      'ScoringService',
    );
  }

  predictRisk(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.scoringClient.PredictRisk(data),
      this.logger,
      'ScoringService',
      'PredictRisk',
    );
  }
}
