import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MailboxService } from './mailbox.service';
import {
  MailProvider as EntityMailProvider,
  ConnectionType as EntityConnectionType,
  MailboxEntity,
} from './entities/mailbox.entity';
import type {
  MailProvider,
  ConnectionType,
  Mailbox,
  CreateMailboxRequest,
  GetMailboxRequest,
  GetMailboxesByOrganisationRequest,
  GetMailboxesBySocieteRequest,
  UpdateMailboxRequest,
  DeleteMailboxRequest,
  MailboxResponse,
  MailboxListResponse,
  DeleteResponse,
} from '@crm/proto/email';

// Enum conversions
const toGrpcMailProvider = (provider: EntityMailProvider): MailProvider => {
  const mapping: Record<EntityMailProvider, MailProvider> = {
    [EntityMailProvider.GMAIL]: 1,
    [EntityMailProvider.OUTLOOK]: 2,
    [EntityMailProvider.EXCHANGE]: 3,
    [EntityMailProvider.SMTP]: 4,
    [EntityMailProvider.OTHER]: 5,
  };
  return mapping[provider] || 0;
};

const fromGrpcMailProvider = (value: MailProvider): EntityMailProvider => {
  const mapping: Record<number, EntityMailProvider> = {
    1: EntityMailProvider.GMAIL,
    2: EntityMailProvider.OUTLOOK,
    3: EntityMailProvider.EXCHANGE,
    4: EntityMailProvider.SMTP,
    5: EntityMailProvider.OTHER,
  };
  return mapping[value] || EntityMailProvider.SMTP;
};

const toGrpcConnectionType = (type: EntityConnectionType): ConnectionType =>
  type === EntityConnectionType.OAUTH2 ? 1 : 2;

const fromGrpcConnectionType = (value: ConnectionType): EntityConnectionType =>
  value === 1 ? EntityConnectionType.OAUTH2 : EntityConnectionType.SMTP_IMAP;

const toGrpcMailbox = (mailbox: MailboxEntity): Mailbox => ({
  id: mailbox.id,
  organisationId: mailbox.organisationId,
  societeId: mailbox.societeId,
  userId: mailbox.userId,
  nom: mailbox.nom,
  adresseEmail: mailbox.adresseEmail,
  fournisseur: toGrpcMailProvider(mailbox.fournisseur),
  typeConnexion: toGrpcConnectionType(mailbox.typeConnexion),
  smtpHost: mailbox.smtpHost,
  smtpPort: mailbox.smtpPort,
  imapHost: mailbox.imapHost,
  imapPort: mailbox.imapPort,
  username: mailbox.username,
  signature: mailbox.signature,
  isDefault: mailbox.isDefault,
  isActive: mailbox.isActive,
  createdAt: mailbox.createdAt?.toISOString() ?? '',
  updatedAt: mailbox.updatedAt?.toISOString() ?? '',
});

@Controller()
export class MailboxController {
  private readonly logger = new Logger(MailboxController.name);

  constructor(private readonly mailboxService: MailboxService) {}

  @GrpcMethod('EmailService', 'CreateMailbox')
  async createMailbox(request: CreateMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.create({
        organisationId: request.organisationId,
        societeId: request.societeId,
        userId: request.userId,
        nom: request.nom,
        adresseEmail: request.adresseEmail,
        fournisseur: fromGrpcMailProvider(request.fournisseur),
        typeConnexion: fromGrpcConnectionType(request.typeConnexion),
        smtpHost: request.smtpHost,
        smtpPort: request.smtpPort,
        imapHost: request.imapHost,
        imapPort: request.imapPort,
        username: request.username,
        password: request.password,
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
        tokenExpiry: request.tokenExpiry ? new Date(request.tokenExpiry) : undefined,
        signature: request.signature,
        isDefault: request.isDefault || false,
      });
      return { mailbox: toGrpcMailbox(mailbox) };
    } catch (e: unknown) {
      this.logger.error('CreateMailbox failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('EmailService', 'GetMailbox')
  async getMailbox(request: GetMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.id);
      return { mailbox: toGrpcMailbox(mailbox) };
    } catch (e: unknown) {
      this.logger.error('GetMailbox failed', e);
      const err = e as { status?: number; message?: string };
      throw new RpcException({
        code: err.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  @GrpcMethod('EmailService', 'GetMailboxesByOrganisation')
  async getMailboxesByOrganisation(request: GetMailboxesByOrganisationRequest): Promise<MailboxListResponse> {
    try {
      const result = await this.mailboxService.findByOrganisation(
        request.organisationId,
        request.limit,
        request.offset,
      );
      return {
        mailboxes: result.mailboxes.map((m) => toGrpcMailbox(m)),
        total: result.total,
      };
    } catch (e: unknown) {
      this.logger.error('GetMailboxesByOrganisation failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('EmailService', 'GetMailboxesBySociete')
  async getMailboxesBySociete(request: GetMailboxesBySocieteRequest): Promise<MailboxListResponse> {
    try {
      const result = await this.mailboxService.findBySociete(
        request.societeId,
        request.limit,
        request.offset,
      );
      return {
        mailboxes: result.mailboxes.map((m) => toGrpcMailbox(m)),
        total: result.total,
      };
    } catch (e: unknown) {
      this.logger.error('GetMailboxesBySociete failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('EmailService', 'UpdateMailbox')
  async updateMailbox(request: UpdateMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.update(request.id, {
        nom: request.nom,
        adresseEmail: request.adresseEmail,
        fournisseur: request.fournisseur !== undefined ? fromGrpcMailProvider(request.fournisseur) : undefined,
        typeConnexion: request.typeConnexion !== undefined ? fromGrpcConnectionType(request.typeConnexion) : undefined,
        smtpHost: request.smtpHost,
        smtpPort: request.smtpPort,
        imapHost: request.imapHost,
        imapPort: request.imapPort,
        username: request.username,
        password: request.password,
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
        tokenExpiry: request.tokenExpiry ? new Date(request.tokenExpiry) : undefined,
        signature: request.signature,
        isDefault: request.isDefault,
        isActive: request.isActive,
      });
      return { mailbox: toGrpcMailbox(mailbox) };
    } catch (e: unknown) {
      this.logger.error('UpdateMailbox failed', e);
      const err = e as { status?: number; message?: string };
      throw new RpcException({
        code: err.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  @GrpcMethod('EmailService', 'DeleteMailbox')
  async deleteMailbox(request: DeleteMailboxRequest): Promise<DeleteResponse> {
    try {
      await this.mailboxService.delete(request.id);
      return { success: true, message: 'Mailbox deleted successfully' };
    } catch (e: unknown) {
      this.logger.error('DeleteMailbox failed', e);
      const err = e as { status?: number; message?: string };
      throw new RpcException({
        code: err.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
}
