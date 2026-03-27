import { DataSource } from 'typeorm';
import { ServingStatus, type ComponentHealth } from './grpc-health.service.js';

export function createPostgresChecker(dataSource: DataSource): () => Promise<ComponentHealth> {
  return async (): Promise<ComponentHealth> => {
    const start = Date.now();
    try {
      await dataSource.query('SELECT 1');
      return { name: 'postgres', status: ServingStatus.SERVING, latencyMs: Date.now() - start, lastSuccessTimestamp: Date.now() };
    } catch (error) {
      return { name: 'postgres', status: ServingStatus.NOT_SERVING, errorMessage: error instanceof Error ? error.message : 'Database connection failed', latencyMs: Date.now() - start };
    }
  };
}

export function createRedisChecker(redisClient: { ping: () => Promise<string> }): () => Promise<ComponentHealth> {
  return async (): Promise<ComponentHealth> => {
    const start = Date.now();
    try {
      const response = await redisClient.ping();
      if (response !== 'PONG') throw new Error(`Unexpected ping response: ${response}`);
      return { name: 'redis', status: ServingStatus.SERVING, latencyMs: Date.now() - start, lastSuccessTimestamp: Date.now() };
    } catch (error) {
      return { name: 'redis', status: ServingStatus.NOT_SERVING, errorMessage: error instanceof Error ? error.message : 'Redis connection failed', latencyMs: Date.now() - start };
    }
  };
}

export function createNatsChecker(natsService: { isConnected: () => boolean }): () => Promise<ComponentHealth> {
  return async (): Promise<ComponentHealth> => {
    const start = Date.now();
    const connected = natsService.isConnected();
    return { name: 'nats', status: connected ? ServingStatus.SERVING : ServingStatus.NOT_SERVING, latencyMs: Date.now() - start, lastSuccessTimestamp: connected ? Date.now() : undefined, errorMessage: connected ? undefined : 'NATS not connected' };
  };
}

export function createMemoryChecker(thresholdMb = 1024): () => Promise<ComponentHealth> {
  return async (): Promise<ComponentHealth> => {
    const heapUsedMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const isHealthy = heapUsedMb < thresholdMb;
    return { name: 'memory', status: isHealthy ? ServingStatus.SERVING : ServingStatus.NOT_SERVING, errorMessage: isHealthy ? undefined : `Memory usage ${heapUsedMb}MB exceeds threshold ${thresholdMb}MB` };
  };
}

export function createEventLoopChecker(thresholdMs = 100): () => Promise<ComponentHealth> {
  return async (): Promise<ComponentHealth> => {
    const start = Date.now();
    return new Promise((resolve) => {
      setImmediate(() => {
        const lag = Date.now() - start;
        resolve({ name: 'event_loop', status: lag < thresholdMs ? ServingStatus.SERVING : ServingStatus.NOT_SERVING, latencyMs: lag, errorMessage: lag < thresholdMs ? undefined : `Event loop lag ${lag}ms exceeds threshold ${thresholdMs}ms` });
      });
    });
  };
}
