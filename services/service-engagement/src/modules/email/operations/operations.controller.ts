import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MailboxService } from '../mailbox/mailbox.service';
import { GoogleOAuthService } from '../oauth/google/google-oauth.service';
import { MicrosoftOAuthService } from '../oauth/microsoft/microsoft-oauth.service';
import {
  MailProvider as EntityMailProvider,
  ConnectionType as EntityConnectionType,
} from '../mailbox/entities/mailbox.entity';
import type {
  SendEmailRequest,
  SendEmailResponse,
  GetEmailsRequest,
  GetEmailRequest,
  EmailResponse,
  EmailListResponse,
  TestConnectionRequest,
  TestConnectionResponse,
} from '@crm/proto/email';

@Controller()
export class OperationsController {
  private readonly logger = new Logger(OperationsController.name);

  constructor(
    private readonly mailboxService: MailboxService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly microsoftOAuthService: MicrosoftOAuthService,
  ) {}

  @GrpcMethod('EmailService', 'SendEmail')
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);
      const { accessToken, refreshToken } = await this.mailboxService.getDecryptedTokens(request.mailboxId);

      const emailOptions = {
        to: request.to.map((r) => r.email),
        cc: request.cc?.map((r) => r.email),
        bcc: request.bcc?.map((r) => r.email),
        subject: request.subject,
        textBody: request.textBody,
        htmlBody: request.htmlBody,
        attachments: request.attachments?.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          content: Buffer.from(a.content),
          contentId: a.contentId,
        })),
        replyTo: request.replyTo,
      };

      let result: { messageId: string };

      if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
        result = await this.googleOAuthService.sendEmail(
          accessToken,
          refreshToken || '',
          emailOptions,
        );
      } else if (
        mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
        mailbox.fournisseur === EntityMailProvider.EXCHANGE
      ) {
        result = await this.microsoftOAuthService.sendEmail(accessToken, emailOptions);
      } else {
        throw new Error('SMTP sending not implemented yet');
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (e: unknown) {
      this.logger.error('SendEmail failed', e);
      return {
        success: false,
        messageId: '',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  @GrpcMethod('EmailService', 'GetEmails')
  async getEmails(request: GetEmailsRequest): Promise<EmailListResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);
      const { accessToken, refreshToken } = await this.mailboxService.getDecryptedTokens(request.mailboxId);

      if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
        const result = await this.googleOAuthService.getEmails(
          accessToken,
          refreshToken || '',
          {
            folder: request.folder,
            limit: request.limit,
            query: request.searchQuery,
          },
        );

        return {
          emails: result.emails.map((e) => ({
            id: e.id,
            mailboxId: request.mailboxId,
            messageId: e.id,
            subject: '',
            folder: request.folder || 'INBOX',
            to: [],
            cc: [],
            attachments: [],
            isRead: false,
            isStarred: false,
            receivedAt: '',
          })),
          total: result.emails.length,
        };
      } else if (
        mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
        mailbox.fournisseur === EntityMailProvider.EXCHANGE
      ) {
        const result = await this.microsoftOAuthService.getEmails(accessToken, {
          folder: request.folder,
          limit: request.limit,
          skip: request.offset,
        });

        return {
          emails: result.emails.map((e) => ({
            id: e.id,
            mailboxId: request.mailboxId,
            messageId: e.id,
            subject: e.subject,
            from: e.from ? { email: String(e.from) } : undefined,
            folder: request.folder || 'inbox',
            to: [],
            cc: [],
            attachments: [],
            isRead: e.isRead,
            isStarred: false,
            receivedAt: e.receivedAt,
          })),
          total: result.total,
        };
      }

      throw new Error('Provider not supported');
    } catch (e: unknown) {
      this.logger.error('GetEmails failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('EmailService', 'GetEmail')
  async getEmail(request: GetEmailRequest): Promise<EmailResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);
      const { accessToken, refreshToken } = await this.mailboxService.getDecryptedTokens(request.mailboxId);

      if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
        const email = await this.googleOAuthService.getEmail(
          accessToken,
          refreshToken || '',
          request.emailId,
        );

        return {
          email: {
            id: email.id,
            mailboxId: request.mailboxId,
            messageId: email.id,
            subject: email.subject,
            from: email.from ? { email: String(email.from) } : undefined,
            to: Array.isArray(email.to) ? email.to.map((e: unknown) => ({ email: String(e) })) : [],
            cc: [],
            textBody: email.textBody,
            htmlBody: email.htmlBody,
            attachments: [],
            folder: '',
            isRead: false,
            isStarred: false,
            receivedAt: email.receivedAt,
          },
        };
      } else if (
        mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
        mailbox.fournisseur === EntityMailProvider.EXCHANGE
      ) {
        const email = await this.microsoftOAuthService.getEmail(accessToken, request.emailId);

        return {
          email: {
            id: email.id,
            mailboxId: request.mailboxId,
            messageId: email.id,
            subject: email.subject,
            from: email.from ? { email: String(email.from) } : undefined,
            to: Array.isArray(email.to) ? email.to.map((e: unknown) => ({ email: String(e) })) : [],
            cc: Array.isArray(email.cc) ? email.cc.map((e: unknown) => ({ email: String(e) })) : [],
            textBody: email.textBody,
            htmlBody: email.htmlBody,
            attachments: [],
            folder: '',
            isRead: email.isRead,
            isStarred: false,
            receivedAt: email.receivedAt,
          },
        };
      }

      throw new Error('Provider not supported');
    } catch (e: unknown) {
      this.logger.error('GetEmail failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('EmailService', 'TestMailboxConnection')
  async testMailboxConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);

      if (mailbox.typeConnexion === EntityConnectionType.OAUTH2) {
        const { accessToken } = await this.mailboxService.getDecryptedTokens(request.mailboxId);

        if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
          await this.googleOAuthService.getUserInfo(accessToken);
        } else if (
          mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
          mailbox.fournisseur === EntityMailProvider.EXCHANGE
        ) {
          await this.microsoftOAuthService.getUserInfo(accessToken);
        }

        await this.mailboxService.updateLastSync(request.mailboxId);

        return {
          success: true,
          message: 'Connection successful',
        };
      } else {
        return {
          success: false,
          message: 'SMTP/IMAP connection test not implemented',
        };
      }
    } catch (e: unknown) {
      this.logger.error('TestMailboxConnection failed', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      await this.mailboxService.setSyncError(request.mailboxId, errorMessage);

      return {
        success: false,
        message: 'Connection failed',
        errorDetails: errorMessage,
      };
    }
  }
}
