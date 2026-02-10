import { Observable } from 'rxjs';
import { HealthService } from './grpc-health.service.js';
import type { HealthCheckRequest, HealthCheckResponse } from './grpc-health.service.js';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(request: HealthCheckRequest): HealthCheckResponse;
    watch(request: HealthCheckRequest): Observable<HealthCheckResponse>;
}
//# sourceMappingURL=health.controller.d.ts.map