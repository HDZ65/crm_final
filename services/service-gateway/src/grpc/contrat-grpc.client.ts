import { Injectable, Inject, OnModuleInit, Logger, HttpException } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ContratServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  GetWithDetails(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class ContratGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ContratGrpcClient.name);
  private contratService: ContratServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.contratService = this.client.getService<ContratServiceClient>('ContratService');
  }

  createContrat(data: Record<string, unknown>): Observable<unknown> {
    return this.contratService.Create(data).pipe(
      catchError((error) => {
        this.logger.error(`gRPC error calling ContratService.Create: ${error.message}`, error.stack);
        throw new HttpException('Service unavailable', 503);
      }),
    );
  }

  getContrat(data: Record<string, unknown>): Observable<unknown> {
    return this.contratService.Get(data).pipe(
      catchError((error) => {
        this.logger.error(`gRPC error calling ContratService.Get: ${error.message}`, error.stack);
        throw new HttpException('Service unavailable', 503);
      }),
    );
  }

  listContrats(data: Record<string, unknown>): Observable<unknown> {
    return this.contratService.List(data).pipe(
      catchError((error) => {
        this.logger.error(`gRPC error calling ContratService.List: ${error.message}`, error.stack);
        throw new HttpException('Service unavailable', 503);
      }),
    );
  }

  updateContrat(data: Record<string, unknown>): Observable<unknown> {
    return this.contratService.Update(data).pipe(
      catchError((error) => {
        this.logger.error(`gRPC error calling ContratService.Update: ${error.message}`, error.stack);
        throw new HttpException('Service unavailable', 503);
      }),
    );
  }

  deleteContrat(data: Record<string, unknown>): Observable<unknown> {
    return this.contratService.Delete(data).pipe(
      catchError((error) => {
        this.logger.error(`gRPC error calling ContratService.Delete: ${error.message}`, error.stack);
        throw new HttpException('Service unavailable', 503);
      }),
    );
  }

  getContratWithDetails(data: Record<string, unknown>): Observable<unknown> {
    return this.contratService.GetWithDetails(data).pipe(
      catchError((error) => {
        this.logger.error(`gRPC error calling ContratService.GetWithDetails: ${error.message}`, error.stack);
        throw new HttpException('Service unavailable', 503);
      }),
    );
  }
}
