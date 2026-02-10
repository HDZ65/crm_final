import { Observable } from 'rxjs';
export declare enum ServingStatus {
    UNKNOWN = 0,
    SERVING = 1,
    NOT_SERVING = 2,
    SERVICE_UNKNOWN = 3
}
export interface HealthCheckRequest {
    service: string;
}
export interface HealthCheckResponse {
    status: ServingStatus;
}
export declare class HealthService {
    private statusSubject;
    private serviceStatus;
    constructor();
    check(request: HealthCheckRequest): HealthCheckResponse;
    watch(request: HealthCheckRequest): Observable<HealthCheckResponse>;
    setServiceStatus(serviceName: string, status: ServingStatus): void;
    getServiceStatus(serviceName: string): ServingStatus;
}
//# sourceMappingURL=grpc-health.service.d.ts.map