import { ScheduleEntity } from '../domain/schedule.entity';
import { ScheduleEntity as ScheduleOrm } from '../../infrastructure/db/entities/schedule.entity';

export class ScheduleMapper {
  static toDomain(orm: ScheduleOrm): ScheduleEntity {
    return new ScheduleEntity({
      id: orm.id,
      organisationId: orm.organisationId,
      factureId: orm.factureId,
      contratId: orm.contratId,
      societeId: orm.societeId,
      clientId: orm.clientId,
      produitId: orm.produitId,

      // Payment info
      pspName: orm.pspName,
      amount: Number(orm.amount),
      currency: orm.currency,

      // Scheduling
      dueDate: orm.dueDate,
      nextDueDate: orm.nextDueDate,
      isRecurring: orm.isRecurring,
      intervalUnit: orm.intervalUnit,
      intervalCount: orm.intervalCount,

      // Status
      status: orm.status,
      retryCount: orm.retryCount,
      maxRetries: orm.maxRetries,
      lastFailureAt: orm.lastFailureAt,
      lastFailureReason: orm.lastFailureReason,

      // PSP references
      pspMandateId: orm.pspMandateId,
      pspCustomerId: orm.pspCustomerId,

      metadata: orm.metadata,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: ScheduleEntity): Partial<ScheduleOrm> {
    return {
      id: domain.id,
      organisationId: domain.organisationId,
      factureId: domain.factureId,
      contratId: domain.contratId,
      societeId: domain.societeId,
      clientId: domain.clientId,
      produitId: domain.produitId,

      // Payment info
      pspName: domain.pspName,
      amount: domain.amount,
      currency: domain.currency,

      // Scheduling
      dueDate: domain.dueDate,
      nextDueDate: domain.nextDueDate,
      isRecurring: domain.isRecurring,
      intervalUnit: domain.intervalUnit,
      intervalCount: domain.intervalCount,

      // Status
      status: domain.status,
      retryCount: domain.retryCount,
      maxRetries: domain.maxRetries,
      lastFailureAt: domain.lastFailureAt,
      lastFailureReason: domain.lastFailureReason,

      // PSP references
      pspMandateId: domain.pspMandateId,
      pspCustomerId: domain.pspCustomerId,

      metadata: domain.metadata,
    };
  }
}
