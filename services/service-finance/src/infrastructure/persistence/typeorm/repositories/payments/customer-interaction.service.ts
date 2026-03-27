import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerInteractionEntity,
  InteractionChannel,
  InteractionStatus,
  ReminderEntity,
  ReminderChannel,
  ReminderStatus,
} from '../../../../../domain/payments/entities';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InteractionStats {
  companyId: string;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
  totalInteractions: number;
}

@Injectable()
export class CustomerInteractionService {
  private readonly logger = new Logger(CustomerInteractionService.name);

  constructor(
    @InjectRepository(CustomerInteractionEntity)
    private readonly interactionRepository: Repository<CustomerInteractionEntity>,
  ) {}

  /**
   * Record a new customer interaction
   */
  async recordInteraction(params: {
    companyId: string;
    customerId: string;
    paymentId?: string;
    channel: InteractionChannel;
    messageType: string;
    payload?: Record<string, any>;
    status?: InteractionStatus;
  }): Promise<CustomerInteractionEntity> {
    const interaction = this.interactionRepository.create({
      companyId: params.companyId,
      customerId: params.customerId,
      paymentId: params.paymentId || null,
      channel: params.channel,
      messageType: params.messageType,
      payload: params.payload || {},
      status: params.status || InteractionStatus.QUEUED,
    });

    const saved = await this.interactionRepository.save(interaction);
    this.logger.debug(
      `Recorded interaction ${saved.id} for customer ${params.customerId}`,
    );

    return saved;
  }

  /**
   * Bridge: Convert ReminderEntity to CustomerInteractionEntity
   * Maps reminder channel to interaction channel and creates interaction record
   */
  async recordFromReminder(
    reminder: ReminderEntity,
  ): Promise<CustomerInteractionEntity> {
    // Map ReminderChannel to InteractionChannel
    const channelMap: Record<ReminderChannel, InteractionChannel> = {
      [ReminderChannel.EMAIL]: InteractionChannel.EMAIL,
      [ReminderChannel.SMS]: InteractionChannel.SMS,
      [ReminderChannel.PHONE_CALL]: InteractionChannel.CALL,
      [ReminderChannel.PUSH_NOTIFICATION]: InteractionChannel.EMAIL, // Default to EMAIL for unsupported channels
      [ReminderChannel.POSTAL_MAIL]: InteractionChannel.EMAIL, // Default to EMAIL for unsupported channels
    };

    // Map ReminderStatus to InteractionStatus
    const statusMap: Record<ReminderStatus, InteractionStatus> = {
      [ReminderStatus.REMINDER_PENDING]: InteractionStatus.QUEUED,
      [ReminderStatus.REMINDER_SENT]: InteractionStatus.SENT,
      [ReminderStatus.REMINDER_DELIVERED]: InteractionStatus.SENT,
      [ReminderStatus.REMINDER_FAILED]: InteractionStatus.FAILED,
      [ReminderStatus.REMINDER_CANCELLED]: InteractionStatus.FAILED,
      [ReminderStatus.REMINDER_BOUNCED]: InteractionStatus.FAILED,
      [ReminderStatus.REMINDER_OPENED]: InteractionStatus.SENT,
      [ReminderStatus.REMINDER_CLICKED]: InteractionStatus.SENT,
    };

    const interaction = this.interactionRepository.create({
      companyId: reminder.societeId,
      customerId: reminder.clientId,
      paymentId: null, // Reminders don't have direct payment_id reference
      channel: channelMap[reminder.channel],
      messageType: reminder.templateId,
      payload: {
        reminderId: reminder.id,
        templateVariables: reminder.templateVariables,
        trigger: reminder.trigger,
        providerName: reminder.providerName,
        providerMessageId: reminder.providerMessageId,
      },
      status: statusMap[reminder.status],
      sentAt: reminder.sentAt,
      errorMessage: reminder.errorMessage,
    });

    const saved = await this.interactionRepository.save(interaction);
    this.logger.debug(
      `Recorded interaction ${saved.id} from reminder ${reminder.id}`,
    );

    return saved;
  }

  /**
   * List interactions by customer with pagination
   */
  async listByCustomer(
    customerId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResult<CustomerInteractionEntity>> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.interactionRepository.findAndCount({
      where: { customerId },
      order: { sentAt: 'DESC' },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * List interactions by payment
   */
  async listByPayment(
    paymentId: string,
  ): Promise<CustomerInteractionEntity[]> {
    return this.interactionRepository.find({
      where: { paymentId },
      order: { sentAt: 'DESC' },
    });
  }

  /**
   * Update interaction status
   */
  async updateStatus(
    interactionId: string,
    status: InteractionStatus,
    errorMessage?: string,
  ): Promise<CustomerInteractionEntity> {
    const interaction = await this.interactionRepository.findOne({
      where: { id: interactionId },
    });

    if (!interaction) {
      throw new NotFoundException(
        `Interaction ${interactionId} not found`,
      );
    }

    interaction.status = status;
    if (errorMessage) {
      interaction.errorMessage = errorMessage;
    }
    if (status === InteractionStatus.SENT && !interaction.sentAt) {
      interaction.sentAt = new Date();
    }

    const updated = await this.interactionRepository.save(interaction);
    this.logger.debug(
      `Updated interaction ${interactionId} status to ${status}`,
    );

    return updated;
  }

  /**
   * Get interaction statistics by company
   */
  async getInteractionStats(companyId: string): Promise<InteractionStats> {
    const interactions = await this.interactionRepository.find({
      where: { companyId },
    });

    const byChannel: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const interaction of interactions) {
      // Count by channel
      byChannel[interaction.channel] =
        (byChannel[interaction.channel] || 0) + 1;

      // Count by status
      byStatus[interaction.status] = (byStatus[interaction.status] || 0) + 1;
    }

    return {
      companyId,
      byChannel,
      byStatus,
      totalInteractions: interactions.length,
    };
  }
}
