import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ISmsService,
  SendSmsInput,
  SendSmsResult,
} from './sms-service.interface';

/**
 * Twilio SMS Service for dunning workflow.
 * Sends SMS reminders to WEB_DIRECT subscribers during CB retry dunning.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */
@Injectable()
export class TwilioSmsService implements ISmsService {
  private readonly logger = new Logger(TwilioSmsService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER', '');
    this.enabled = !!(this.accountSid && this.authToken && this.fromNumber);

    if (!this.enabled) {
      this.logger.warn(
        'TwilioSmsService: Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER — SMS sending disabled',
      );
    }
  }

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    if (!this.enabled) {
      this.logger.warn(`SMS not sent (disabled): to=${input.to}`);
      return {
        success: false,
        messageId: null,
        errorCode: 'SMS_DISABLED',
        errorMessage: 'Twilio credentials not configured',
      };
    }

    try {
      // Twilio REST API - POST /2010-04-01/Accounts/{AccountSid}/Messages.json
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const body = new URLSearchParams({
        To: input.to,
        From: this.fromNumber,
        Body: input.body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Twilio SMS failed: status=${response.status} body=${errorBody}`,
        );
        return {
          success: false,
          messageId: null,
          errorCode: `HTTP_${response.status}`,
          errorMessage: errorBody,
        };
      }

      const result = (await response.json()) as { sid: string; status: string };

      this.logger.log(
        `SMS sent: to=${input.to} sid=${result.sid} status=${result.status}`,
      );

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      this.logger.error(`Twilio SMS error: ${error.message}`, error.stack);
      return {
        success: false,
        messageId: null,
        errorCode: 'EXCEPTION',
        errorMessage: error.message,
      };
    }
  }
}
