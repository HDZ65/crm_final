import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface WincashSvcClient {
  SyncCashback(data: Record<string, unknown>): Observable<unknown>;
  GetOperation(data: Record<string, unknown>): Observable<unknown>;
  ListOperations(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class WincashGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(WincashGrpcClient.name);
  private wincashService: WincashSvcClient;

  constructor(@Inject('ENGAGEMENT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.wincashService =
      this.client.getService<WincashSvcClient>('WincashSvc');
  }

  syncCashback(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wincashService.SyncCashback(data),
      this.logger,
      'WincashSvc',
      'SyncCashback',
    );
  }

  getOperation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wincashService.GetOperation(data),
      this.logger,
      'WincashSvc',
      'GetOperation',
    );
  }

  listOperations(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wincashService.ListOperations(data),
      this.logger,
      'WincashSvc',
      'ListOperations',
    );
  }
}
