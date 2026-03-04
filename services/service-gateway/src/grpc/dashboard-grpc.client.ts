import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ==================== SERVICE INTERFACES ====================

export interface DashboardKpisServiceClient {
  GetKpis(data: Record<string, unknown>): Observable<unknown>;
}

export interface EvolutionCaServiceClient {
  GetEvolutionCa(data: Record<string, unknown>): Observable<unknown>;
}

export interface RepartitionProduitsServiceClient {
  GetRepartitionProduits(data: Record<string, unknown>): Observable<unknown>;
}

export interface StatsSocietesServiceClient {
  GetStatsSocietes(data: Record<string, unknown>): Observable<unknown>;
}

export interface AlertesServiceClient {
  GetAlertes(data: Record<string, unknown>): Observable<unknown>;
}

export interface KpisCommerciauxServiceClient {
  GetKpisCommerciaux(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class DashboardGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(DashboardGrpcClient.name);
  private dashboardKpisService: DashboardKpisServiceClient;
  private evolutionCaService: EvolutionCaServiceClient;
  private repartitionProduitsService: RepartitionProduitsServiceClient;
  private statsSocietesService: StatsSocietesServiceClient;
  private alertesService: AlertesServiceClient;
  private kpisCommerciauxService: KpisCommerciauxServiceClient;

  constructor(@Inject('CORE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.dashboardKpisService =
      this.client.getService<DashboardKpisServiceClient>('DashboardKpisService');
    this.evolutionCaService =
      this.client.getService<EvolutionCaServiceClient>('EvolutionCaService');
    this.repartitionProduitsService =
      this.client.getService<RepartitionProduitsServiceClient>('RepartitionProduitsService');
    this.statsSocietesService =
      this.client.getService<StatsSocietesServiceClient>('StatsSocietesService');
    this.alertesService =
      this.client.getService<AlertesServiceClient>('AlertesService');
    this.kpisCommerciauxService =
      this.client.getService<KpisCommerciauxServiceClient>('KpisCommerciauxService');
  }

  // ==================== DashboardKpisService ====================

  getKpis(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.dashboardKpisService.GetKpis(data),
      this.logger,
      'DashboardKpisService',
      'GetKpis',
    );
  }

  // ==================== EvolutionCaService ====================

  getEvolutionCa(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.evolutionCaService.GetEvolutionCa(data),
      this.logger,
      'EvolutionCaService',
      'GetEvolutionCa',
    );
  }

  // ==================== RepartitionProduitsService ====================

  getRepartitionProduits(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.repartitionProduitsService.GetRepartitionProduits(data),
      this.logger,
      'RepartitionProduitsService',
      'GetRepartitionProduits',
    );
  }

  // ==================== StatsSocietesService ====================

  getStatsSocietes(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statsSocietesService.GetStatsSocietes(data),
      this.logger,
      'StatsSocietesService',
      'GetStatsSocietes',
    );
  }

  // ==================== AlertesService ====================

  getAlertes(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.alertesService.GetAlertes(data),
      this.logger,
      'AlertesService',
      'GetAlertes',
    );
  }

  // ==================== KpisCommerciauxService ====================

  getKpisCommerciaux(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.kpisCommerciauxService.GetKpisCommerciaux(data),
      this.logger,
      'KpisCommerciauxService',
      'GetKpisCommerciaux',
    );
  }
}
