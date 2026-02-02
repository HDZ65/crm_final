import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export enum ServingStatus {
  UNKNOWN = 0,
  SERVING = 1,
  NOT_SERVING = 2,
  SERVICE_UNKNOWN = 3,
}

export interface HealthCheckRequest {
  service: string;
}

export interface HealthCheckResponse {
  status: ServingStatus;
}

@Injectable()
export class HealthService {
  private statusSubject = new Subject<HealthCheckResponse>();
  private serviceStatus: Map<string, ServingStatus> = new Map();

  constructor() {
    this.serviceStatus.set('', ServingStatus.SERVING);
  }

  check(request: HealthCheckRequest): HealthCheckResponse {
    const serviceName = request.service || '';
    const status = this.serviceStatus.get(serviceName) ?? ServingStatus.SERVICE_UNKNOWN;
    return { status };
  }

  watch(request: HealthCheckRequest): Observable<HealthCheckResponse> {
    const serviceName = request.service || '';
    const status = this.serviceStatus.get(serviceName) ?? ServingStatus.SERVICE_UNKNOWN;
    this.statusSubject.next({ status });
    return this.statusSubject.asObservable();
  }

  setServiceStatus(serviceName: string, status: ServingStatus): void {
    this.serviceStatus.set(serviceName, status);
    this.statusSubject.next({ status });
  }

  getServiceStatus(serviceName: string): ServingStatus {
    return this.serviceStatus.get(serviceName) ?? ServingStatus.SERVICE_UNKNOWN;
  }
}
