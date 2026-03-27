import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  ReconductionTaciteLogEntity,
  ReconductionTaciteStatus,
} from '../../../../../domain/contrats/entities/reconduction-tacite-log.entity';
import { IReconductionTaciteRepository } from '../../../../../domain/contrats/repositories/IReconductionTaciteRepository';

@Injectable()
export class ReconductionTaciteLogService implements IReconductionTaciteRepository {
  private readonly logger = new Logger(ReconductionTaciteLogService.name);

  constructor(
    @InjectRepository(ReconductionTaciteLogEntity)
    private readonly repository: Repository<ReconductionTaciteLogEntity>,
  ) {}

  async findByContratId(contratId: string): Promise<ReconductionTaciteLogEntity | null> {
    return this.repository.findOne({ where: { contratId } });
  }

  async findContratsDueForJ90(date: Date): Promise<ReconductionTaciteLogEntity[]> {
    const cutoffDate = new Date(date);
    cutoffDate.setDate(cutoffDate.getDate() + 90);

    return this.repository
      .createQueryBuilder('log')
      .innerJoin('contrat', 'c', 'c.id = log.contrat_id')
      .leftJoinAndSelect('log.contrat', 'contrat')
      .where('c.tacite_renewal_enabled = :enabled', { enabled: true })
      .andWhere('log.renewal_date <= :cutoff', { cutoff: cutoffDate })
      .andWhere('log.notification_j90_sent = :sent', { sent: false })
      .andWhere('log.status = :status', { status: ReconductionTaciteStatus.PENDING })
      .getMany();
  }

  async findContratsDueForJ30(date: Date): Promise<ReconductionTaciteLogEntity[]> {
    const cutoffDate = new Date(date);
    cutoffDate.setDate(cutoffDate.getDate() + 30);

    return this.repository
      .createQueryBuilder('log')
      .innerJoin('contrat', 'c', 'c.id = log.contrat_id')
      .leftJoinAndSelect('log.contrat', 'contrat')
      .where('c.tacite_renewal_enabled = :enabled', { enabled: true })
      .andWhere('log.renewal_date <= :cutoff', { cutoff: cutoffDate })
      .andWhere('log.notification_j30_sent = :sent', { sent: false })
      .andWhere('log.status IN (:...statuses)', {
        statuses: [
          ReconductionTaciteStatus.PENDING,
          ReconductionTaciteStatus.NOTIFIED_J90,
        ],
      })
      .getMany();
  }

  async markJ90Sent(contratId: string): Promise<void> {
    await this.repository.update(
      { contratId },
      {
        notificationJ90Sent: true,
        status: ReconductionTaciteStatus.NOTIFIED_J90,
      },
    );
  }

  async markJ30Sent(contratId: string): Promise<void> {
    await this.repository.update(
      { contratId },
      {
        notificationJ30Sent: true,
        status: ReconductionTaciteStatus.NOTIFIED_J30,
      },
    );
  }

  async markRenewed(contratId: string): Promise<void> {
    await this.repository.update(
      { contratId },
      { status: ReconductionTaciteStatus.RENEWED },
    );
  }

  async markCancelled(contratId: string, reason: string): Promise<void> {
    await this.repository.update(
      { contratId },
      {
        status: ReconductionTaciteStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    );
  }

  async create(data: Partial<ReconductionTaciteLogEntity>): Promise<ReconductionTaciteLogEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
