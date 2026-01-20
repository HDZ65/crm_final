import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MailboxEntity,
  MailProvider,
  ConnectionType,
} from './entities/mailbox.entity';
import { EncryptionService } from '../../common/encryption.service';

export interface CreateMailboxInput {
  organisationId: string;
  societeId?: string;
  userId?: string;
  nom: string;
  adresseEmail: string;
  fournisseur: MailProvider;
  typeConnexion: ConnectionType;
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  signature?: string;
  isDefault?: boolean;
}

export interface UpdateMailboxInput {
  nom?: string;
  adresseEmail?: string;
  fournisseur?: MailProvider;
  typeConnexion?: ConnectionType;
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  signature?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

@Injectable()
export class MailboxService {
  private readonly logger = new Logger(MailboxService.name);

  constructor(
    @InjectRepository(MailboxEntity)
    private readonly mailboxRepository: Repository<MailboxEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(input: CreateMailboxInput): Promise<MailboxEntity> {
    // If setting as default, unset other defaults for this user/societe
    if (input.isDefault) {
      await this.unsetOtherDefaults(input.organisationId, input.societeId, input.userId);
    }

    const mailbox = this.mailboxRepository.create({
      ...input,
      password: input.password
        ? this.encryptionService.encrypt(input.password)
        : undefined,
      accessToken: input.accessToken
        ? this.encryptionService.encrypt(input.accessToken)
        : undefined,
      refreshToken: input.refreshToken
        ? this.encryptionService.encrypt(input.refreshToken)
        : undefined,
    });

    const saved = await this.mailboxRepository.save(mailbox);
    this.logger.log(`Created mailbox ${saved.id} for organisation ${input.organisationId}`);
    return saved;
  }

  async findById(id: string): Promise<MailboxEntity> {
    const mailbox = await this.mailboxRepository.findOne({ where: { id } });
    if (!mailbox) {
      throw new NotFoundException(`Mailbox with id ${id} not found`);
    }
    return mailbox;
  }

  async findByOrganisation(
    organisationId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ mailboxes: MailboxEntity[]; total: number }> {
    const [mailboxes, total] = await this.mailboxRepository.findAndCount({
      where: { organisationId },
      take: limit || 50,
      skip: offset || 0,
      order: { createdAt: 'DESC' },
    });

    return { mailboxes, total };
  }

  async findBySociete(
    societeId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ mailboxes: MailboxEntity[]; total: number }> {
    const [mailboxes, total] = await this.mailboxRepository.findAndCount({
      where: { societeId },
      take: limit || 50,
      skip: offset || 0,
      order: { createdAt: 'DESC' },
    });

    return { mailboxes, total };
  }

  async update(id: string, input: UpdateMailboxInput): Promise<MailboxEntity> {
    const mailbox = await this.findById(id);

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await this.unsetOtherDefaults(
        mailbox.organisationId,
        mailbox.societeId,
        mailbox.userId,
        id,
      );
    }

    // Encrypt sensitive fields if provided
    const updateData: Partial<MailboxEntity> = { ...input };
    if (input.password) {
      updateData.password = this.encryptionService.encrypt(input.password);
    }
    if (input.accessToken) {
      updateData.accessToken = this.encryptionService.encrypt(input.accessToken);
    }
    if (input.refreshToken) {
      updateData.refreshToken = this.encryptionService.encrypt(input.refreshToken);
    }

    Object.assign(mailbox, updateData);
    const saved = await this.mailboxRepository.save(mailbox);
    this.logger.log(`Updated mailbox ${id}`);
    return saved;
  }

  async delete(id: string): Promise<void> {
    const mailbox = await this.findById(id);
    await this.mailboxRepository.remove(mailbox);
    this.logger.log(`Deleted mailbox ${id}`);
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date,
  ): Promise<MailboxEntity> {
    const mailbox = await this.findById(id);

    mailbox.accessToken = this.encryptionService.encrypt(accessToken);
    if (refreshToken) {
      mailbox.refreshToken = this.encryptionService.encrypt(refreshToken);
    }
    if (tokenExpiry) {
      mailbox.tokenExpiry = tokenExpiry;
    }
    mailbox.syncError = null;

    return this.mailboxRepository.save(mailbox);
  }

  async getDecryptedTokens(
    id: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const mailbox = await this.findById(id);

    if (!mailbox.accessToken) {
      throw new Error('Mailbox has no access token');
    }

    return {
      accessToken: this.encryptionService.decrypt(mailbox.accessToken),
      refreshToken: mailbox.refreshToken
        ? this.encryptionService.decrypt(mailbox.refreshToken)
        : undefined,
    };
  }

  async getDecryptedCredentials(
    id: string,
  ): Promise<{ username: string; password: string }> {
    const mailbox = await this.findById(id);

    if (!mailbox.username || !mailbox.password) {
      throw new Error('Mailbox has no SMTP credentials');
    }

    return {
      username: mailbox.username,
      password: this.encryptionService.decrypt(mailbox.password),
    };
  }

  async setSyncError(id: string, error: string): Promise<void> {
    await this.mailboxRepository.update(id, {
      syncError: error,
      lastSyncAt: new Date(),
    });
  }

  async updateLastSync(id: string): Promise<void> {
    await this.mailboxRepository.update(id, {
      lastSyncAt: new Date(),
      syncError: null,
    });
  }

  private async unsetOtherDefaults(
    organisationId: string,
    societeId?: string,
    userId?: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.mailboxRepository
      .createQueryBuilder()
      .update(MailboxEntity)
      .set({ isDefault: false })
      .where('organisation_id = :organisationId', { organisationId })
      .andWhere('is_default = true');

    if (societeId) {
      qb.andWhere('societe_id = :societeId', { societeId });
    }
    if (userId) {
      qb.andWhere('user_id = :userId', { userId });
    }
    if (excludeId) {
      qb.andWhere('id != :excludeId', { excludeId });
    }

    await qb.execute();
  }
}
