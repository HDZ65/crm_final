import { describe, it, expect, beforeEach } from 'bun:test';
import { ClientExternalMappingEntity, SourceSystem } from '../client-external-mapping.entity';

describe('ClientExternalMappingEntity', () => {
  let entity: ClientExternalMappingEntity;

  beforeEach(() => {
    entity = new ClientExternalMappingEntity();
  });

  describe('Entity Creation', () => {
    it('should create an entity with all required fields', () => {
      entity.id = '550e8400-e29b-41d4-a716-446655440000';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.sourceSystem = SourceSystem.IMS;
      entity.sourceChannel = 'web';
      entity.imsUserId = 'IMS_USER_123';
      entity.storeCustomerId = null;
      entity.metadata = { custom_field: 'value' };
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      expect(entity.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(entity.organisationId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(entity.clientId).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(entity.sourceSystem).toBe(SourceSystem.IMS);
      expect(entity.sourceChannel).toBe('web');
      expect(entity.imsUserId).toBe('IMS_USER_123');
      expect(entity.storeCustomerId).toBeNull();
      expect(entity.metadata).toEqual({ custom_field: 'value' });
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });

    it('should support nullable fields', () => {
      entity.id = '550e8400-e29b-41d4-a716-446655440000';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.sourceSystem = SourceSystem.WEB;
      entity.sourceChannel = null;
      entity.imsUserId = null;
      entity.storeCustomerId = null;
      entity.metadata = null;

      expect(entity.sourceChannel).toBeNull();
      expect(entity.imsUserId).toBeNull();
      expect(entity.storeCustomerId).toBeNull();
      expect(entity.metadata).toBeNull();
    });

    it('should support all SourceSystem enum values', () => {
      const systems = [
        SourceSystem.IMS,
        SourceSystem.WEB,
        SourceSystem.MOBILE_APP,
        SourceSystem.TV_APP,
        SourceSystem.BOX,
      ];

      systems.forEach((system) => {
        entity.sourceSystem = system;
        expect(entity.sourceSystem).toBe(system);
      });
    });

    it('should support complex metadata objects', () => {
      const complexMetadata = {
        nested: {
          field1: 'value1',
          field2: 123,
          field3: true,
        },
        array: [1, 2, 3],
        timestamp: new Date().toISOString(),
      };

      entity.metadata = complexMetadata;
      expect(entity.metadata).toEqual(complexMetadata);
    });
  });

  describe('Field Validation', () => {
    it('should allow IMS user ID with various formats', () => {
      const testIds = [
        'IMS_USER_123',
        'user@example.com',
        '12345',
        'user-123-abc',
      ];

      testIds.forEach((id) => {
        entity.imsUserId = id;
        expect(entity.imsUserId).toBe(id);
      });
    });

    it('should allow store customer ID with various formats', () => {
      const testIds = [
        'STORE_CUST_123',
        'cust-456',
        '789',
        'customer_abc_def',
      ];

      testIds.forEach((id) => {
        entity.storeCustomerId = id;
        expect(entity.storeCustomerId).toBe(id);
      });
    });

    it('should allow source channel with various formats', () => {
      const channels = [
        'web',
        'ios',
        'android',
        'samsung_tv',
        'lg_tv',
        'box_orange',
      ];

      channels.forEach((channel) => {
        entity.sourceChannel = channel;
        expect(entity.sourceChannel).toBe(channel);
      });
    });
  });

  describe('Timestamp Management', () => {
    it('should have createdAt and updatedAt timestamps', () => {
      const now = new Date();
      entity.createdAt = now;
      entity.updatedAt = now;

      expect(entity.createdAt).toBe(now);
      expect(entity.updatedAt).toBe(now);
    });

    it('should allow updatedAt to be different from createdAt', () => {
      const created = new Date('2025-01-01');
      const updated = new Date('2025-02-07');

      entity.createdAt = created;
      entity.updatedAt = updated;

      expect(entity.createdAt).toBe(created);
      expect(entity.updatedAt).toBe(updated);
      expect(entity.updatedAt.getTime()).toBeGreaterThan(entity.createdAt.getTime());
    });
  });

  describe('Entity Relationships', () => {
    it('should maintain organisation_id for multi-tenancy', () => {
      const orgId = '550e8400-e29b-41d4-a716-446655440001';
      entity.organisationId = orgId;

      expect(entity.organisationId).toBe(orgId);
    });

    it('should maintain client_id reference to service-core', () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.clientId = clientId;

      expect(entity.clientId).toBe(clientId);
    });

    it('should support multiple mappings per client', () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440002';
      const entity1 = new ClientExternalMappingEntity();
      const entity2 = new ClientExternalMappingEntity();

      entity1.clientId = clientId;
      entity1.sourceSystem = SourceSystem.IMS;
      entity1.imsUserId = 'IMS_123';

      entity2.clientId = clientId;
      entity2.sourceSystem = SourceSystem.WEB;
      entity2.imsUserId = null;

      expect(entity1.clientId).toBe(entity2.clientId);
      expect(entity1.sourceSystem).not.toBe(entity2.sourceSystem);
    });
  });

  describe('Uniqueness Constraints', () => {
    it('should support unique ims_user_id per organisation', () => {
      const orgId = '550e8400-e29b-41d4-a716-446655440001';
      const imsUserId = 'IMS_USER_123';

      entity.organisationId = orgId;
      entity.imsUserId = imsUserId;

      // In real DB, this would be enforced by unique constraint
      // Here we just verify the entity can hold these values
      expect(entity.organisationId).toBe(orgId);
      expect(entity.imsUserId).toBe(imsUserId);
    });

    it('should allow null ims_user_id (partial unique index)', () => {
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.imsUserId = null;

      // Multiple entities can have null ims_user_id
      expect(entity.imsUserId).toBeNull();
    });
  });
});
