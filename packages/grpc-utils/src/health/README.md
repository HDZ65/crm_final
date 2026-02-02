# gRPC Health Check Protocol

Standard implementation of the gRPC Health Check protocol as defined in the [official gRPC documentation](https://github.com/grpc/grpc/blob/master/doc/health-checking.md).

## Overview

The Health Check protocol provides a standard way for gRPC services to report their health status. This is essential for:
- Load balancers to route traffic only to healthy instances
- Kubernetes liveness and readiness probes
- Service mesh health monitoring
- Client-side health awareness

## Usage

### 1. Add Health Check to Your Service Module

Import `HealthService` and `HealthController` in your service's app module:

```typescript
import { Module } from '@nestjs/common';
import { HealthService, HealthController } from '@crm/grpc-utils';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class AppModule {}
```

### 2. Configure gRPC Options

Ensure your service loads the health.proto file:

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getGrpcOptions } from '@crm/grpc-utils';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: getGrpcOptions('your-service-name'),
    }
  );
  await app.listen();
}

bootstrap();
```

### 3. Update Service Status (Optional)

If you need to update the service status dynamically:

```typescript
import { Injectable } from '@nestjs/common';
import { HealthService, ServingStatus } from '@crm/grpc-utils';

@Injectable()
export class MyService {
  constructor(private healthService: HealthService) {}

  async initialize() {
    try {
      // Initialize your service
      this.healthService.setServiceStatus('', ServingStatus.SERVING);
    } catch (error) {
      this.healthService.setServiceStatus('', ServingStatus.NOT_SERVING);
    }
  }
}
```

## Testing

### Using grpcurl

Test the health check endpoint with grpcurl:

```bash
# Check overall service health
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# Check specific service health
grpcurl -plaintext -d '{"service":"my-service"}' localhost:50051 grpc.health.v1.Health/Check

# Watch for health status changes (streaming)
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Watch
```

### Using Node.js Client

```typescript
import { createGrpcClient } from '@crm/grpc-utils';

const client = await createGrpcClient('health', 'localhost:50051');
const response = await client.check({ service: '' });
console.log('Service status:', response.status);
```

## Status Codes

- `UNKNOWN (0)`: Status unknown
- `SERVING (1)`: Service is healthy and ready to serve
- `NOT_SERVING (2)`: Service is unhealthy
- `SERVICE_UNKNOWN (3)`: Service name not found

## Kubernetes Integration

Add health checks to your Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  template:
    spec:
      containers:
      - name: my-service
        livenessProbe:
          exec:
            command:
            - /bin/grpc_health_probe
            - -addr=:50051
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - /bin/grpc_health_probe
            - -addr=:50051
          initialDelaySeconds: 5
          periodSeconds: 5
```

Download grpc_health_probe: https://github.com/grpc-ecosystem/grpc-health-probe

## References

- [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- [gRPC Health Probe](https://github.com/grpc-ecosystem/grpc-health-probe)
- [NestJS gRPC Documentation](https://docs.nestjs.com/microservices/grpc)
