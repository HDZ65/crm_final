import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  messageId: string;
  accepted: boolean;
}

export interface IEmailSender {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}

@Injectable()
export class EmailSenderService implements IEmailSender {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter: Transporter | null = null;
  private readonly isMockMode: boolean;
  private readonly smtpFrom: string;

  constructor() {
    const smtpHost = process.env.SMTP_HOST;
    this.isMockMode = !smtpHost || smtpHost.trim() === '';
    this.smtpFrom = process.env.SMTP_FROM || 'noreply@crm.local';

    if (!this.isMockMode) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials incomplete. Falling back to mock mode.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.logger.log(`SMTP transporter initialized: ${smtpHost}:${smtpPort}`);
    } catch (error) {
      this.logger.error(`Failed to initialize SMTP transporter: ${error}`);
      this.transporter = null;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, htmlBody, textBody, replyTo, attachments } = options;

    if (this.isMockMode || !this.transporter) {
      this.logger.log(`[EMAIL MOCK] Sending email to: ${to} subject: ${subject}`);
      return {
        messageId: `mock-${Date.now()}`,
        accepted: true,
      };
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.smtpFrom,
        to,
        subject,
        html: htmlBody,
        text: textBody,
        replyTo,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      this.logger.log(`Email sent successfully to ${to} (messageId: ${result.messageId})`);

      return {
        messageId: result.messageId || `${Date.now()}`,
        accepted: true,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
      throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
