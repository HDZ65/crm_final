import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { HealthService, HealthCheckRequest, HealthCheckResponse } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @GrpcMethod('Health', 'Check')
  check(request: HealthCheckRequest): HealthCheckResponse {
    return this.healthService.check(request);
  }

  @GrpcMethod('Health', 'Watch')
  watch(request: HealthCheckRequest): Observable<HealthCheckResponse> {
    return this.healthService.watch(request);
  }
}
