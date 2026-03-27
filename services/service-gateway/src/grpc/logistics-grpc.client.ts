import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface LogisticsServiceClient {
  CreateExpedition(data: Record<string, unknown>): Observable<unknown>;
  GetExpedition(data: Record<string, unknown>): Observable<unknown>;
  GetExpeditionsByClient(data: Record<string, unknown>): Observable<unknown>;
  GetExpeditionsByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  UpdateExpedition(data: Record<string, unknown>): Observable<unknown>;
  DeleteExpedition(data: Record<string, unknown>): Observable<unknown>;
  CreateColis(data: Record<string, unknown>): Observable<unknown>;
  GetColis(data: Record<string, unknown>): Observable<unknown>;
  GetColisByExpedition(data: Record<string, unknown>): Observable<unknown>;
  UpdateColis(data: Record<string, unknown>): Observable<unknown>;
  DeleteColis(data: Record<string, unknown>): Observable<unknown>;
  CreateTrackingEvent(data: Record<string, unknown>): Observable<unknown>;
  GetTrackingEvents(data: Record<string, unknown>): Observable<unknown>;
  GetLatestTrackingEvent(data: Record<string, unknown>): Observable<unknown>;
  CreateCarrierAccount(data: Record<string, unknown>): Observable<unknown>;
  GetCarrierAccount(data: Record<string, unknown>): Observable<unknown>;
  GetCarrierAccountsByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  UpdateCarrierAccount(data: Record<string, unknown>): Observable<unknown>;
  DeleteCarrierAccount(data: Record<string, unknown>): Observable<unknown>;
  GenerateLabel(data: Record<string, unknown>): Observable<unknown>;
  TrackShipment(data: Record<string, unknown>): Observable<unknown>;
  ValidateAddress(data: Record<string, unknown>): Observable<unknown>;
  SimulatePricing(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class LogisticsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(LogisticsGrpcClient.name);
  private logisticsService: LogisticsServiceClient;

  constructor(@Inject('LOGISTICS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.logisticsService =
      this.client.getService<LogisticsServiceClient>('LogisticsService');
  }

  // ==================== EXPEDITIONS ====================

  createExpedition(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.CreateExpedition(data),
      this.logger,
      'LogisticsService',
      'CreateExpedition',
    );
  }

  getExpedition(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetExpedition(data),
      this.logger,
      'LogisticsService',
      'GetExpedition',
    );
  }

  getExpeditionsByClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetExpeditionsByClient(data),
      this.logger,
      'LogisticsService',
      'GetExpeditionsByClient',
    );
  }

  getExpeditionsByOrganisation(
    data: Record<string, unknown>,
  ): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetExpeditionsByOrganisation(data),
      this.logger,
      'LogisticsService',
      'GetExpeditionsByOrganisation',
    );
  }

  updateExpedition(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.UpdateExpedition(data),
      this.logger,
      'LogisticsService',
      'UpdateExpedition',
    );
  }

  deleteExpedition(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.DeleteExpedition(data),
      this.logger,
      'LogisticsService',
      'DeleteExpedition',
    );
  }

  // ==================== COLIS (PARCELS) ====================

  createColis(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.CreateColis(data),
      this.logger,
      'LogisticsService',
      'CreateColis',
    );
  }

  getColis(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetColis(data),
      this.logger,
      'LogisticsService',
      'GetColis',
    );
  }

  getColisByExpedition(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetColisByExpedition(data),
      this.logger,
      'LogisticsService',
      'GetColisByExpedition',
    );
  }

  updateColis(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.UpdateColis(data),
      this.logger,
      'LogisticsService',
      'UpdateColis',
    );
  }

  deleteColis(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.DeleteColis(data),
      this.logger,
      'LogisticsService',
      'DeleteColis',
    );
  }

  // ==================== TRACKING EVENTS ====================

  createTrackingEvent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.CreateTrackingEvent(data),
      this.logger,
      'LogisticsService',
      'CreateTrackingEvent',
    );
  }

  getTrackingEvents(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetTrackingEvents(data),
      this.logger,
      'LogisticsService',
      'GetTrackingEvents',
    );
  }

  getLatestTrackingEvent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetLatestTrackingEvent(data),
      this.logger,
      'LogisticsService',
      'GetLatestTrackingEvent',
    );
  }

  // ==================== CARRIER ACCOUNTS ====================

  createCarrierAccount(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.CreateCarrierAccount(data),
      this.logger,
      'LogisticsService',
      'CreateCarrierAccount',
    );
  }

  getCarrierAccount(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetCarrierAccount(data),
      this.logger,
      'LogisticsService',
      'GetCarrierAccount',
    );
  }

  getCarrierAccountsByOrganisation(
    data: Record<string, unknown>,
  ): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GetCarrierAccountsByOrganisation(data),
      this.logger,
      'LogisticsService',
      'GetCarrierAccountsByOrganisation',
    );
  }

  updateCarrierAccount(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.UpdateCarrierAccount(data),
      this.logger,
      'LogisticsService',
      'UpdateCarrierAccount',
    );
  }

  deleteCarrierAccount(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.DeleteCarrierAccount(data),
      this.logger,
      'LogisticsService',
      'DeleteCarrierAccount',
    );
  }

  // ==================== MAILEVA OPERATIONS ====================

  generateLabel(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.GenerateLabel(data),
      this.logger,
      'LogisticsService',
      'GenerateLabel',
    );
  }

  trackShipment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.TrackShipment(data),
      this.logger,
      'LogisticsService',
      'TrackShipment',
    );
  }

  validateAddress(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.ValidateAddress(data),
      this.logger,
      'LogisticsService',
      'ValidateAddress',
    );
  }

  simulatePricing(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.logisticsService.SimulatePricing(data),
      this.logger,
      'LogisticsService',
      'SimulatePricing',
    );
  }
}
