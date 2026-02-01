import { SERVICE_REGISTRY, getServiceConfig, getServiceUrl, ServiceName } from './service-config';

describe('ServiceConfig', () => {
  describe('SERVICE_REGISTRY', () => {
    it('should contain all expected services', () => {
      const expectedServices = [
        'activites', 'clients', 'commerciaux', 'commission', 'contrats',
        'dashboard', 'documents', 'email', 'factures', 'logistics',
        'notifications', 'organisations', 'payments', 'products',
        'referentiel', 'relance', 'users', 'calendar', 'retry',
      ];

      for (const service of expectedServices) {
        expect(SERVICE_REGISTRY[service]).toBeDefined();
      }
    });

    it('should have required fields for each service', () => {
      for (const [name, config] of Object.entries(SERVICE_REGISTRY)) {
        expect(config.package).toBeDefined();
        expect(config.protoFile).toBeDefined();
        expect(config.defaultPort).toBeGreaterThan(0);
        expect(config.serviceName).toBeDefined();
      }
    });

    it('should have unique ports for each service', () => {
      const ports = Object.values(SERVICE_REGISTRY).map((c) => c.defaultPort);
      const uniquePorts = new Set(ports);
      expect(uniquePorts.size).toBe(ports.length);
    });

    it('should have correct proto file paths', () => {
      for (const config of Object.values(SERVICE_REGISTRY)) {
        expect(config.protoFile).toMatch(/\.proto$/);
        expect(config.protoFile).toContain('/');
      }
    });
  });

  describe('getServiceConfig', () => {
    it('should return config for valid service', () => {
      const config = getServiceConfig('clients');

      expect(config.package).toBe('clients');
      expect(config.protoFile).toBe('clients/clients.proto');
      expect(config.defaultPort).toBe(50052);
      expect(config.serviceName).toBe('ClientsService');
    });

    it('should return config for payments service', () => {
      const config = getServiceConfig('payments');

      expect(config.package).toBe('payment');
      expect(config.protoFile).toBe('payments/payment.proto');
      expect(config.defaultPort).toBe(50063);
    });

    it('should return config for calendar service', () => {
      const config = getServiceConfig('calendar');

      expect(config.package).toBe('calendar');
      expect(config.defaultPort).toBe(50068);
    });

    it('should throw error for unknown service', () => {
      expect(() => getServiceConfig('unknown' as ServiceName)).toThrow('Unknown service: unknown');
    });

    it('should include valid services in error message', () => {
      try {
        getServiceConfig('invalid' as ServiceName);
      } catch (error: any) {
        expect(error.message).toContain('Valid services:');
        expect(error.message).toContain('clients');
        expect(error.message).toContain('payments');
      }
    });
  });

  describe('getServiceUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return default URL with default host and port', () => {
      delete process.env.GRPC_HOST;
      delete process.env.GRPC_PORT;

      const url = getServiceUrl('clients');

      expect(url).toBe('0.0.0.0:50052');
    });

    it('should use GRPC_HOST env variable', () => {
      process.env.GRPC_HOST = 'localhost';
      delete process.env.GRPC_PORT;

      const url = getServiceUrl('clients');

      expect(url).toBe('localhost:50052');
    });

    it('should use service-specific port env variable', () => {
      process.env.CLIENTS_GRPC_PORT = '9999';

      const url = getServiceUrl('clients');

      expect(url).toContain(':9999');
    });

    it('should use GRPC_PORT as fallback', () => {
      process.env.GRPC_PORT = '8888';

      const url = getServiceUrl('clients');

      expect(url).toContain(':8888');
    });

    it('should allow custom host parameter', () => {
      const url = getServiceUrl('clients', 'my-host');

      expect(url).toBe('my-host:50052');
    });

    it('should work for all services', () => {
      const services: ServiceName[] = [
        'activites', 'clients', 'payments', 'calendar', 'retry',
      ];

      for (const service of services) {
        const url = getServiceUrl(service);
        expect(url).toMatch(/^[\w.-]+:\d+$/);
      }
    });
  });

  describe('service port assignments', () => {
    it('should have clients on port 50052', () => {
      expect(SERVICE_REGISTRY.clients.defaultPort).toBe(50052);
    });

    it('should have payments on port 50063', () => {
      expect(SERVICE_REGISTRY.payments.defaultPort).toBe(50063);
    });

    it('should have calendar on port 50068', () => {
      expect(SERVICE_REGISTRY.calendar.defaultPort).toBe(50068);
    });

    it('should have retry on port 50070', () => {
      expect(SERVICE_REGISTRY.retry.defaultPort).toBe(50070);
    });

    it('should have users on port 50067', () => {
      expect(SERVICE_REGISTRY.users.defaultPort).toBe(50067);
    });
  });
});
