/**
 * Email Service abstraction for dunning workflow.
 * Publishes NATS events to service-engagement for actual email delivery.
 * Implementations: NatsEmailService (prod), MockEmailService (test/dev).
 */
export interface SendEmailInput {
  templateId: string;
  recipientClientId: string;
  variables: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string | null;
  errorCode?: string;
  errorMessage?: string;
}

export const EMAIL_SERVICE_TOKEN = 'IEmailService';

export interface IEmailService {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
