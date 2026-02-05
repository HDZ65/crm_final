import {
  CreateMailboxDto,
  UpdateMailboxDto,
  MailboxResponseDto,
} from '../dtos';

export interface IMailboxService {
  create(dto: CreateMailboxDto): Promise<MailboxResponseDto>;
  findById(id: string): Promise<MailboxResponseDto>;
  findByOrganisation(
    organisationId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ mailboxes: MailboxResponseDto[]; total: number }>;
  findBySociete(
    societeId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ mailboxes: MailboxResponseDto[]; total: number }>;
  update(id: string, dto: UpdateMailboxDto): Promise<MailboxResponseDto>;
  delete(id: string): Promise<void>;
  updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date,
  ): Promise<MailboxResponseDto>;
  getDecryptedTokens(id: string): Promise<{ accessToken: string; refreshToken?: string }>;
  getDecryptedCredentials(id: string): Promise<{ username: string; password: string }>;
}

export const MAILBOX_SERVICE = Symbol('IMailboxService');
