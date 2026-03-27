import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

export enum ServingStatus {
  UNKNOWN = 0,
  SERVING = 1,
  NOT_SERVING = 2,
  SERVICE_UNKNOWN = 3,
}

export type HealthChecker = () => Promise<ComponentHealth>;

export interface ComponentHealth {
  name: string;
  status: ServingStatus;
  errorMessage?: string;
  latencyMs?: number;
  lastSuccessTimestamp?: number;
}

export interface HealthCheckResponse {
  status: ServingStatus;
  details?: HealthDetails;
}

export interface HealthDetails {
  version: string;
  uptimeSeconds: number;
  timestamp: number;
  components: ComponentHealth[];
}

@Injectable()
export class GrpcHealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GrpcHealthService.name);
  private readonly checkers = new Map<string, HealthChecker>();
  private readonly serviceStatus = new Map<string, ServingStatus>();
  private startTime: number = Date.now();
  private serviceName = 'unknown';
  private version = '1.0.0';
  private watchInterval: NodeJS.Timeout | null = null;

  configure(config: { serviceName: string; version: string }): void {
    this.serviceName = config.serviceName;
    this.version = config.version;
  }

  onModuleInit(): void {
    this.startTime = Date.now();
    this.serviceStatus.set('', ServingStatus.SERVING);
    this.watchInterval = setInterval(() => {
      this.performHealthChecks().catch((err) => this.logger.error('Health check failed', err));
    }, 10000);
  }

  onModuleDestroy(): void {
    if (this.watchInterval) clearInterval(this.watchInterval);
    this.serviceStatus.forEach((_, key) => this.serviceStatus.set(key, ServingStatus.NOT_SERVING));
  }

  registerChecker(name: string, checker: HealthChecker): void {
    this.checkers.set(name, checker);
    this.serviceStatus.set(name, ServingStatus.UNKNOWN);
    this.logger.log(`Registered health checker: ${name}`);
  }

  unregisterChecker(name: string): void {
    this.checkers.delete(name);
    this.serviceStatus.delete(name);
  }

  async check(service: string = ''): Promise<HealthCheckResponse> {
    if (service && service !== this.serviceName) {
      const status = this.serviceStatus.get(service);
      if (status === undefined) return { status: ServingStatus.SERVICE_UNKNOWN };
      return { status };
    }
    const components = await this.performHealthChecks();
    const overallStatus = this.calculateOverallStatus(components);
    return {
      status: overallStatus,
      details: {
        version: this.version,
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: Date.now(),
        components,
      },
    };
  }

  getStatus(service: string = ''): ServingStatus {
    return this.serviceStatus.get(service) ?? ServingStatus.SERVICE_UNKNOWN;
  }

  setStatus(service: string, status: ServingStatus): void {
    this.serviceStatus.set(service, status);
  }

  private async performHealthChecks(): Promise<ComponentHealth[]> {
    const results: ComponentHealth[] = [];
    for (const [name, checker] of this.checkers) {
      try {
        const health = await checker();
        results.push(health);
        this.serviceStatus.set(name, health.status);
      } catch (error) {
        results.push({ name, status: ServingStatus.NOT_SERVING, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
        this.serviceStatus.set(name, ServingStatus.NOT_SERVING);
      }
    }
    this.serviceStatus.set('', this.calculateOverallStatus(results));
    return results;
  }

  private calculateOverallStatus(components: ComponentHealth[]): ServingStatus {
    if (components.length === 0) return ServingStatus.SERVING;
    if (components.some((c) => c.status === ServingStatus.NOT_SERVING)) return ServingStatus.NOT_SERVING;
    if (components.some((c) => c.status === ServingStatus.UNKNOWN)) return ServingStatus.UNKNOWN;
    return ServingStatus.SERVING;
  }
}

@Controller()
export class GrpcHealthController {
  constructor(private readonly healthService: GrpcHealthService) {}

  @GrpcMethod('Health', 'Check')
  async check(data: { service?: string }): Promise<HealthCheckResponse> {
    return this.healthService.check(data.service || '');
  }
}

@Controller()
export class ReadinessProbeController {
  constructor(private readonly healthService: GrpcHealthService) {}

  @GrpcMethod('ReadinessProbe', 'Check')
  async check(): Promise<{ ready: boolean; message: string; components: ComponentHealth[] }> {
    const health = await this.healthService.check();
    return {
      ready: health.status === ServingStatus.SERVING,
      message: health.status === ServingStatus.SERVING ? 'Service is ready' : 'Service is not ready',
      components: health.details?.components || [],
    };
  }
}

@Controller()
export class LivenessProbeController {
  constructor(private readonly healthService: GrpcHealthService) {}

  @GrpcMethod('LivenessProbe', 'Check')
  async check(): Promise<{ alive: boolean; message: string }> {
    return { alive: true, message: 'Service is alive' };
  }
}
