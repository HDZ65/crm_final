import { ScheduleStatus } from '../../../../../domain/payments/entities/schedule.entity';
import { MockSmsService } from '../../../../external/sms/mock-sms.service';
import { MockImsClientService } from '../../../../external/ims/mock-ims-client.service';
import {
  buildMondialTvRetryPolicy,
  buildMondialTvReminderPolicy,
  MONDIAL_TV_RETRY_POLICY_ID,
  MONDIAL_TV_REMINDER_POLICY_ID,
  DunningSeedService,
} from './dunning-seed.service';
import { CbUpdateSessionService } from './cb-update-session.service';
import { DunningMaxRetriesExceededHandler } from '../../../../messaging/nats/handlers/dunning-max-retries-exceeded.handler';

// ============================================================================
// 1. MockSmsService tests
// ============================================================================
describe('MockSmsService', () => {
  it('sends SMS and records the message', async () => {
    const sms = new MockSmsService();

    const result = await sms.sendSms({
      to: '+33612345678',
      body: 'Votre CB a été refusée. Mettez à jour ici: https://portal.mondial-tv.fr/cb-update?token=abc',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
    expect(sms.sentMessages).toHaveLength(1);
    expect(sms.sentMessages[0].to).toBe('+33612345678');
    expect(sms.getLastMessage()?.body).toContain('CB a été refusée');
  });

  it('resets recorded messages', async () => {
    const sms = new MockSmsService();
    await sms.sendSms({ to: '+33600000000', body: 'test' });
    expect(sms.sentMessages).toHaveLength(1);
    sms.reset();
    expect(sms.sentMessages).toHaveLength(0);
  });
});

// ============================================================================
// 2. RetryPolicy Seed Data tests
// ============================================================================
describe('RetryPolicy Seed Data', () => {
  it('builds Mondial TV retry policy with correct values', () => {
    const policy = buildMondialTvRetryPolicy();

    expect(policy.id).toBe(MONDIAL_TV_RETRY_POLICY_ID);
    expect(policy.name).toBe('Mondial TV - CB Dunning');
    expect(policy.retryDelaysDays).toEqual([2, 5, 10]);
    expect(policy.maxAttempts).toBe(3);
    expect(policy.maxTotalDays).toBe(10);
    expect(policy.backoffStrategy).toBe('FIXED');
    expect(policy.isActive).toBe(true);
  });

  it('seeds retry policy via DunningSeedService (insert)', async () => {
    let savedEntity: any = null;
    const retryPolicyRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: any) => data),
      save: jest.fn(async (entity: any) => {
        savedEntity = entity;
        return entity;
      }),
    };
    const reminderPolicyRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: any) => data),
      save: jest.fn(async (entity: any) => entity),
    };

    const service = new DunningSeedService(
      retryPolicyRepo as any,
      reminderPolicyRepo as any,
    );

    const result = await service.seedRetryPolicy();

    expect(retryPolicyRepo.findOne).toHaveBeenCalledWith({
      where: { id: MONDIAL_TV_RETRY_POLICY_ID },
    });
    expect(retryPolicyRepo.create).toHaveBeenCalled();
    expect(retryPolicyRepo.save).toHaveBeenCalled();
    expect(result.retryDelaysDays).toEqual([2, 5, 10]);
  });

  it('skips seed when retry policy already exists', async () => {
    const existing = { id: MONDIAL_TV_RETRY_POLICY_ID, name: 'existing' };
    const retryPolicyRepo = {
      findOne: jest.fn().mockResolvedValue(existing),
      create: jest.fn(),
      save: jest.fn(),
    };
    const reminderPolicyRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: any) => data),
      save: jest.fn(async (entity: any) => entity),
    };

    const service = new DunningSeedService(
      retryPolicyRepo as any,
      reminderPolicyRepo as any,
    );

    const result = await service.seedRetryPolicy();

    expect(result).toBe(existing);
    expect(retryPolicyRepo.create).not.toHaveBeenCalled();
    expect(retryPolicyRepo.save).not.toHaveBeenCalled();
  });
});

// ============================================================================
// 3. ReminderPolicy Seed Data tests
// ============================================================================
describe('ReminderPolicy Seed Data', () => {
  it('builds Mondial TV reminder policy with 4 trigger rules', () => {
    const policy = buildMondialTvReminderPolicy();

    expect(policy.id).toBe(MONDIAL_TV_REMINDER_POLICY_ID);
    expect(policy.name).toBe('Mondial TV - Dunning Reminders');
    expect(policy.triggerRules).toHaveLength(4);

    const [j0, j2, j5, j10] = policy.triggerRules!;

    // J0: PAYMENT_FAILED → email
    expect(j0.trigger).toBe('PAYMENT_FAILED');
    expect(j0.channel).toBe('email');
    expect(j0.templateId).toBe('mondial-tv-soft-reminder');

    // J+2: RETRY_SCHEDULED → sms
    expect(j2.trigger).toBe('RETRY_SCHEDULED');
    expect(j2.channel).toBe('sms');
    expect(j2.templateId).toBe('mondial-tv-cb-update-sms');

    // J+5: RETRY_FAILED → email
    expect(j5.trigger).toBe('RETRY_FAILED');
    expect(j5.channel).toBe('email');
    expect(j5.templateId).toBe('mondial-tv-final-warning');

    // J+10: MAX_RETRIES_EXCEEDED → system
    expect(j10.trigger).toBe('MAX_RETRIES_EXCEEDED');
    expect(j10.channel).toBe('system');
    expect(j10.templateId).toBe('mondial-tv-suspension');
  });
});

// ============================================================================
// 4. DunningMaxRetriesExceededHandler tests
// ============================================================================
describe('DunningMaxRetriesExceededHandler', () => {
  it('calls IMS notifySuspension and transitions schedule to SUSPENDED', async () => {
    const mockSchedule = {
      id: 'sch-1',
      status: ScheduleStatus.ACTIVE,
      metadata: {},
    };

    const scheduleRepository = {
      findOne: jest.fn().mockResolvedValue(mockSchedule),
      save: jest.fn(async (entity: any) => entity),
    };

    const imsClient = new MockImsClientService();

    const handler = new DunningMaxRetriesExceededHandler(
      scheduleRepository as any,
      imsClient,
    );

    await handler.handle({
      subscriptionId: 'sub-mondial-1',
      scheduleId: 'sch-1',
      clientId: 'client-1',
      organisationId: 'org-1',
      retryPolicyId: MONDIAL_TV_RETRY_POLICY_ID,
      totalAttempts: 3,
      lastFailureCode: 'INSUFFICIENT_FUNDS',
      occurredAt: new Date().toISOString(),
    });

    // IMS was called
    expect(imsClient.suspensionNotifications).toHaveLength(1);
    expect(imsClient.getLastNotification()?.subscriptionId).toBe('sub-mondial-1');
    expect(imsClient.getLastNotification()?.externalRef).toBeTruthy();

    // Schedule was transitioned
    expect(scheduleRepository.save).toHaveBeenCalled();
    expect(mockSchedule.status).toBe(ScheduleStatus.PAUSED);
    expect(mockSchedule.metadata.suspendedByDunning).toBe(true);
    expect(mockSchedule.metadata.totalRetryAttempts).toBe(3);
  });

  it('handles missing schedule gracefully', async () => {
    const scheduleRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };

    const imsClient = new MockImsClientService();

    const handler = new DunningMaxRetriesExceededHandler(
      scheduleRepository as any,
      imsClient,
    );

    // Should not throw
    await handler.handle({
      subscriptionId: 'sub-2',
      scheduleId: 'non-existent',
      clientId: 'client-2',
      organisationId: 'org-1',
      retryPolicyId: MONDIAL_TV_RETRY_POLICY_ID,
      totalAttempts: 3,
      occurredAt: new Date().toISOString(),
    });

    // IMS was still called (notification goes through)
    expect(imsClient.suspensionNotifications).toHaveLength(1);
    // But save was NOT called
    expect(scheduleRepository.save).not.toHaveBeenCalled();
  });
});

// ============================================================================
// 5. CbUpdateSessionService tests
// ============================================================================
describe('CbUpdateSessionService', () => {
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'PORTAL_BASE_URL') return 'https://portal.test.fr';
      return defaultValue;
    }),
  };

  it('creates a 24h session for WEB_DIRECT subscriber', async () => {
    const service = new CbUpdateSessionService(mockConfigService as any);

    const session = await service.createSession({
      clientId: 'client-1',
      organisationId: 'org-1',
      scheduleId: 'sch-1',
      subscriptionType: 'WEB_DIRECT',
    });

    expect(session.token).toBeTruthy();
    expect(session.token.length).toBe(64); // 32 bytes hex
    expect(session.tokenHash).toBeTruthy();
    expect(session.link).toContain('https://portal.test.fr/cb-update?token=');
    expect(session.expiresAt).toBeInstanceOf(Date);

    // Verify 24h expiry (within 1 second tolerance)
    const diffMs = session.expiresAt.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
  });

  it('rejects STORE subscription type', async () => {
    const service = new CbUpdateSessionService(mockConfigService as any);

    await expect(
      service.createSession({
        clientId: 'client-2',
        organisationId: 'org-1',
        scheduleId: 'sch-2',
        subscriptionType: 'STORE',
      }),
    ).rejects.toThrow('CB update sessions are only available for WEB_DIRECT');
  });

  it('validates a token and returns the session', async () => {
    const service = new CbUpdateSessionService(mockConfigService as any);

    const session = await service.createSession({
      clientId: 'client-3',
      organisationId: 'org-1',
      scheduleId: 'sch-3',
      subscriptionType: 'WEB_DIRECT',
    });

    const validated = await service.validateToken(session.token);
    expect(validated).not.toBeNull();
    expect(validated!.clientId).toBe('client-3');
  });

  it('returns null for invalid token', async () => {
    const service = new CbUpdateSessionService(mockConfigService as any);

    const validated = await service.validateToken('invalid-token-here');
    expect(validated).toBeNull();
  });
});

// ============================================================================
// 6. MockImsClientService tests
// ============================================================================
describe('MockImsClientService', () => {
  it('records suspension notifications', async () => {
    const client = new MockImsClientService();

    const result = await client.notifySuspension({
      subscriptionId: 'sub-1',
      clientId: 'client-1',
      organisationId: 'org-1',
      reason: 'MAX_RETRIES_EXCEEDED',
      effectiveDate: new Date().toISOString(),
    });

    expect(result.acknowledged).toBe(true);
    expect(result.externalRef).toBeTruthy();
    expect(client.suspensionNotifications).toHaveLength(1);
  });
});
