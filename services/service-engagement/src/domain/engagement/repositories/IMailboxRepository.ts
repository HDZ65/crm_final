import { MailboxEntity } from '../entities/mailbox.entity';

export interface IMailboxRepository {
  findById(id: string): Promise<MailboxEntity | null>;
  findByOrganisation(
    organisationId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ mailboxes: MailboxEntity[]; total: number }>;
  findBySociete(
    societeId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ mailboxes: MailboxEntity[]; total: number }>;
  save(entity: MailboxEntity): Promise<MailboxEntity>;
  delete(id: string): Promise<void>;
  updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date,
  ): Promise<MailboxEntity>;
}
