import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface BundleSvcClient {
  GetConfiguration(data: Record<string, unknown>): Observable<unknown>;
  GetConfigurationByCode(data: Record<string, unknown>): Observable<unknown>;
  CreateConfiguration(data: Record<string, unknown>): Observable<unknown>;
  UpdateConfiguration(data: Record<string, unknown>): Observable<unknown>;
  ListConfigurations(data: Record<string, unknown>): Observable<unknown>;
  DeleteConfiguration(data: Record<string, unknown>): Observable<unknown>;
  CalculatePrice(data: Record<string, unknown>): Observable<unknown>;
  RecalculateClient(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class BundleGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(BundleGrpcClient.name);
  private bundleSvc: BundleSvcClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.bundleSvc = this.client.getService<BundleSvcClient>('BundleSvc');
  }

  getConfiguration(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.GetConfiguration(data),
      this.logger,
      'BundleSvc',
      'GetConfiguration',
    );
  }

  getConfigurationByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.GetConfigurationByCode(data),
      this.logger,
      'BundleSvc',
      'GetConfigurationByCode',
    );
  }

  createConfiguration(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.CreateConfiguration(data),
      this.logger,
      'BundleSvc',
      'CreateConfiguration',
    );
  }

  updateConfiguration(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.UpdateConfiguration(data),
      this.logger,
      'BundleSvc',
      'UpdateConfiguration',
    );
  }

  listConfigurations(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.ListConfigurations(data),
      this.logger,
      'BundleSvc',
      'ListConfigurations',
    );
  }

  deleteConfiguration(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.DeleteConfiguration(data),
      this.logger,
      'BundleSvc',
      'DeleteConfiguration',
    );
  }

  calculatePrice(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.CalculatePrice(data),
      this.logger,
      'BundleSvc',
      'CalculatePrice',
    );
  }

  recalculateClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.bundleSvc.RecalculateClient(data),
      this.logger,
      'BundleSvc',
      'RecalculateClient',
    );
  }
}
