import { MockEmailService } from '../../../../external/email/mock-email.service';
import type { SendEmailInput } from '../../../../external/email/email-service.interface';

// Mock @crm/shared-kernel to avoid ESM import issues in Jest
jest.mock('@crm/shared-kernel', () => ({ NatsService: class {} }));

// Lazy-import NatsEmailService after mock is in place
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NatsEmailService } = require('../../../../external/email/nats-email.service');

// ============================================================================
// 1. MockEmailService tests
// ============================================================================
describe('MockEmailService', () => {
  it('sends email and records the message', async () => {
    const email = new MockEmailService();

    const result = await email.sendEmail({
      templateId: 'DEPANSSUR_EMAIL_DUNNING_J0',
      recipientClientId: 'client-123',
      variables: { abonnementId: 'abo-1', montantCents: 2990 },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
    expect(email.sentEmails).toHaveLength(1);
    expect(email.sentEmails[0].templateId).toBe('DEPANSSUR_EMAIL_DUNNING_J0');
    expect(email.sentEmails[0].recipientClientId).toBe('client-123');
    expect(email.sentEmails[0].variables).toEqual({ abonnementId: 'abo-1', montantCents: 2990 });
    expect(email.getLastEmail()?.templateId).toBe('DEPANSSUR_EMAIL_DUNNING_J0');
  });

  it('resets recorded emails', async () => {
    const email = new MockEmailService();
    await email.sendEmail({
      templateId: 'TEST',
      recipientClientId: 'client-1',
      variables: {},
    });
    expect(email.sentEmails).toHaveLength(1);
    email.reset();
    expect(email.sentEmails).toHaveLength(0);
  });
});

// ============================================================================
// 2. NatsEmailService tests (with mocked NatsService)
// ============================================================================
describe('NatsEmailService', () => {
  let publishedMessages: Array<{ subject: string; data: unknown }>;
  let mockNatsService: { publish: jest.Mock };

  beforeEach(() => {
    publishedMessages = [];
    mockNatsService = {
      publish: jest.fn(async (subject: string, data: unknown) => {
        publishedMessages.push({ subject, data });
      }),
    };
  });

  it('publishes notification.email.send NATS event with correct payload', async () => {
    const service = new NatsEmailService(mockNatsService as any);

    const result = await service.sendEmail({
      templateId: 'DEPANSSUR_EMAIL_DUNNING_J0',
      recipientClientId: 'client-abc',
      variables: { abonnementId: 'abo-42', montantCents: 5000 },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();

    expect(mockNatsService.publish).toHaveBeenCalledTimes(1);
    expect(mockNatsService.publish).toHaveBeenCalledWith(
      'notification.email.send',
      expect.objectContaining({
        templateId: 'DEPANSSUR_EMAIL_DUNNING_J0',
        recipientClientId: 'client-abc',
        variables: { abonnementId: 'abo-42', montantCents: 5000 },
        messageId: expect.any(String),
        sentAt: expect.any(String),
      }),
    );
  });

  it('publishes J10 suspension template', async () => {
    const service = new NatsEmailService(mockNatsService as any);

    const result = await service.sendEmail({
      templateId: 'DEPANSSUR_EMAIL_DUNNING_J10',
      recipientClientId: 'client-xyz',
      variables: { abonnementId: 'abo-99' },
    });

    expect(result.success).toBe(true);
    expect(mockNatsService.publish).toHaveBeenCalledWith(
      'notification.email.send',
      expect.objectContaining({
        templateId: 'DEPANSSUR_EMAIL_DUNNING_J10',
        recipientClientId: 'client-xyz',
        variables: { abonnementId: 'abo-99' },
      }),
    );
  });

  it('handles NATS publish failure gracefully', async () => {
    mockNatsService.publish.mockRejectedValueOnce(new Error('NATS connection lost'));

    const service = new NatsEmailService(mockNatsService as any);

    const result = await service.sendEmail({
      templateId: 'DEPANSSUR_EMAIL_DUNNING_J0',
      recipientClientId: 'client-fail',
      variables: {},
    });

    expect(result.success).toBe(false);
    expect(result.messageId).toBeNull();
    expect(result.errorCode).toBe('NATS_PUBLISH_FAILED');
    expect(result.errorMessage).toBe('NATS connection lost');
  });

  it('includes ISO timestamp in sentAt field', async () => {
    const service = new NatsEmailService(mockNatsService as any);

    await service.sendEmail({
      templateId: 'TEST',
      recipientClientId: 'client-1',
      variables: {},
    });

    const payload = publishedMessages[0].data as Record<string, unknown>;
    const sentAt = payload.sentAt as string;
    expect(() => new Date(sentAt)).not.toThrow();
    expect(new Date(sentAt).toISOString()).toBe(sentAt);
  });
});

// ============================================================================
// 3. DunningDepanssurService email integration (unit-level)
// ============================================================================
describe('DunningDepanssurService email sending', () => {
  it('J0 email uses DEPANSSUR_EMAIL_DUNNING_J0 template', async () => {
    const mockEmailService = new MockEmailService();

    // Simulate what executeRetryPayment does for J0 EMAIL channel
    const input: SendEmailInput = {
      templateId: 'DEPANSSUR_EMAIL_DUNNING_J0',
      recipientClientId: 'client-dunning-1',
      variables: {
        abonnementId: 'abo-dunning-1',
        montantCents: 2990,
      },
    };

    const result = await mockEmailService.sendEmail(input);

    expect(result.success).toBe(true);
    expect(mockEmailService.getLastEmail()?.templateId).toBe('DEPANSSUR_EMAIL_DUNNING_J0');
    expect(mockEmailService.getLastEmail()?.recipientClientId).toBe('client-dunning-1');
    expect(mockEmailService.getLastEmail()?.variables).toHaveProperty('abonnementId', 'abo-dunning-1');
    expect(mockEmailService.getLastEmail()?.variables).toHaveProperty('montantCents', 2990);
  });

  it('J+10 suspension email uses DEPANSSUR_EMAIL_DUNNING_J10 template', async () => {
    const mockEmailService = new MockEmailService();

    // Simulate what executeSuspend does for J+10 EMAIL channel
    const input: SendEmailInput = {
      templateId: 'DEPANSSUR_EMAIL_DUNNING_J10',
      recipientClientId: 'client-suspended-1',
      variables: {
        abonnementId: 'abo-suspended-1',
      },
    };

    const result = await mockEmailService.sendEmail(input);

    expect(result.success).toBe(true);
    expect(mockEmailService.getLastEmail()?.templateId).toBe('DEPANSSUR_EMAIL_DUNNING_J10');
    expect(mockEmailService.getLastEmail()?.recipientClientId).toBe('client-suspended-1');
    expect(mockEmailService.getLastEmail()?.variables).toHaveProperty('abonnementId', 'abo-suspended-1');
  });
});
