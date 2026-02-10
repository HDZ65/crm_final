import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MailboxService } from '../persistence/typeorm/repositories/engagement';
import {
  MailProvider as EntityMailProvider,
  ConnectionType as EntityConnectionType,
  MailboxEntity,
} from '../../domain/engagement/entities';
import type {
  Mailbox as MailboxProto,
  CreateMailboxRequest,
  GetMailboxRequest,
  GetMailboxesByOrganisationRequest,
  GetMailboxesBySocieteRequest,
  UpdateMailboxRequest,
  DeleteMailboxRequest,
  MailboxResponse,
  MailboxListResponse,
  DeleteResponse,
  MailProvider,
  ConnectionType,
} from '@proto/email';

// Enum conversions
const toGrpcMailProvider = (provider: EntityMailProvider): MailProvider => {
  const mapping: Record<EntityMailProvider, number> = {
    [EntityMailProvider.GMAIL]: 1,
    [EntityMailProvider.OUTLOOK]: 2,
    [EntityMailProvider.EXCHANGE]: 3,
    [EntityMailProvider.SMTP]: 4,
    [EntityMailProvider.OTHER]: 5,
  };
  return (mapping[provider] || 0) as MailProvider;
};

const fromGrpcMailProvider = (value: number): EntityMailProvider => {
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
  (type === EntityConnectionType.OAUTH2 ? 1 : 2) as ConnectionType;

const fromGrpcConnectionType = (value: number): EntityConnectionType =>
  value === 1 ? EntityConnectionType.OAUTH2 : EntityConnectionType.SMTP_IMAP;

const toProto = (mailbox: MailboxEntity): MailboxProto => ({
  id: mailbox.id,
  organisation_id: mailbox.organisationId,
  societe_id: mailbox.societeId,
  user_id: mailbox.userId,
  nom: mailbox.nom,
  adresse_email: mailbox.adresseEmail,
  fournisseur: toGrpcMailProvider(mailbox.fournisseur),
  type_connexion: toGrpcConnectionType(mailbox.typeConnexion),
  smtp_host: mailbox.smtpHost,
  smtp_port: mailbox.smtpPort,
  imap_host: mailbox.imapHost,
  imap_port: mailbox.imapPort,
  username: mailbox.username,
  signature: mailbox.signature,
  is_default: mailbox.isDefault,
  is_active: mailbox.isActive,
  created_at: mailbox.createdAt?.toISOString() ?? '',
  updated_at: mailbox.updatedAt?.toISOString() ?? '',
});

@Controller()
export class MailboxController {
  private readonly logger = new Logger(MailboxController.name);

  constructor(private readonly mailboxService: MailboxService) {}

  @GrpcMethod('EmailService', 'CreateMailbox')
  async createMailbox(request: CreateMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.create({
        organisationId: request.organisation_id,
        societeId: request.societe_id,
        userId: request.user_id,
        nom: request.nom,
        adresseEmail: request.adresse_email,
        fournisseur: fromGrpcMailProvider(request.fournisseur),
        typeConnexion: fromGrpcConnectionType(request.type_connexion),
        smtpHost: request.smtp_host,
        smtpPort: request.smtp_port,
        imapHost: request.imap_host,
        imapPort: request.imap_port,
        username: request.username,
        password: request.password,
        accessToken: request.access_token,
        refreshToken: request.refresh_token,
        tokenExpiry: request.token_expiry ? new Date(request.token_expiry) : undefined,
        signature: request.signature,
        isDefault: request.is_default || false,
      });
      return { mailbox: toProto(mailbox) };
    } catch (e: unknown) {
      this.logger.error('CreateMailbox failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('EmailService', 'GetMailbox')
  async getMailbox(request: GetMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.id);
      return { mailbox: toProto(mailbox) };
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
        request.organisation_id,
        request.limit,
        request.offset,
      );
      return {
        mailboxes: result.mailboxes.map((m) => toProto(m)),
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
        request.societe_id,
        request.limit,
        request.offset,
      );
      return {
        mailboxes: result.mailboxes.map((m) => toProto(m)),
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
        adresseEmail: request.adresse_email,
        fournisseur: request.fournisseur !== undefined ? fromGrpcMailProvider(request.fournisseur) : undefined,
        typeConnexion: request.type_connexion !== undefined ? fromGrpcConnectionType(request.type_connexion) : undefined,
        smtpHost: request.smtp_host,
        smtpPort: request.smtp_port,
        imapHost: request.imap_host,
        imapPort: request.imap_port,
        username: request.username,
        password: request.password,
        accessToken: request.access_token,
        refreshToken: request.refresh_token,
        tokenExpiry: request.token_expiry ? new Date(request.token_expiry) : undefined,
        signature: request.signature,
        isDefault: request.is_default,
        isActive: request.is_active,
      });
      return { mailbox: toProto(mailbox) };
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
