/**
 * SMS Service abstraction for dunning workflow.
 * Implementations: TwilioSmsService (prod), MockSmsService (test/dev).
 */
export interface SendSmsInput {
  to: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface SendSmsResult {
  success: boolean;
  messageId: string | null;
  errorCode?: string;
  errorMessage?: string;
}

export const SMS_SERVICE_TOKEN = 'ISmsService';

export interface ISmsService {
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
}
