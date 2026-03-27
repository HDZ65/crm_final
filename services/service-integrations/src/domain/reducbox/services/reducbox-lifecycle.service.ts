import { NatsService } from '@crm/shared-kernel';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ReducBoxAccessRepositoryService } from '../../../infrastructure/persistence/typeorm/repositories/reducbox';
import { ReducBoxAccessEntity, ReducBoxAccessStatus } from '../entities/reducbox-access.entity';
import { REDUCBOX_PORT, type ReducBoxPort } from '../ports/reducbox.port';

@Injectable()
export class ReducBoxLifecycleService {
  private readonly logger = new Logger(ReducBoxLifecycleService.name);

  constructor(
    @Inject(REDUCBOX_PORT)
    private readonly reducBoxPort: ReducBoxPort,
    private readonly reducBoxAccessRepository: ReducBoxAccessRepositoryService,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async createAccess(clientId: string, contratId: string): Promise<ReducBoxAccessEntity> {
    this.logger.log(`Creating ReducBox access for client=${clientId}, contrat=${contratId}`);

    const { externalAccessId } = await this.reducBoxPort.createAccess(clientId, contratId);

    const access = await this.reducBoxAccessRepository.create({
      clientId,
      contratId,
      externalAccessId,
      status: ReducBoxAccessStatus.ACTIVE,
    });

    await this.reducBoxAccessRepository.addHistory({
      accessId: access.id,
      previousStatus: ReducBoxAccessStatus.PENDING,
      newStatus: ReducBoxAccessStatus.ACTIVE,
      reason: 'Initial access creation',
      changedBy: 'system',
    });

    await this.publishEvent('crm.commercial.reducbox.access.created', {
      accessId: access.id,
      clientId,
      contratId,
      externalAccessId,
      status: ReducBoxAccessStatus.ACTIVE,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(`ReducBox access created: id=${access.id}, externalId=${externalAccessId}`);
    return access;
  }

  async suspendAccess(accessId: string, reason: string): Promise<ReducBoxAccessEntity> {
    this.logger.log(`Suspending ReducBox access=${accessId}, reason=${reason}`);

    const access = await this.requireAccess(accessId);

    if (!access.externalAccessId) {
      throw new Error(`ReducBox access ${accessId} has no external access ID`);
    }

    await this.reducBoxPort.suspendAccess(access.externalAccessId, reason);

    const previousStatus = access.status;
    access.status = ReducBoxAccessStatus.SUSPENDED;
    access.suspendedAt = new Date();

    const updated = await this.reducBoxAccessRepository.update(access);

    await this.reducBoxAccessRepository.addHistory({
      accessId: updated.id,
      previousStatus,
      newStatus: ReducBoxAccessStatus.SUSPENDED,
      reason,
      changedBy: 'system',
    });

    await this.publishEvent('crm.commercial.reducbox.access.suspended', {
      accessId: updated.id,
      clientId: updated.clientId,
      contratId: updated.contratId,
      externalAccessId: updated.externalAccessId,
      previousStatus,
      status: ReducBoxAccessStatus.SUSPENDED,
      reason,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(`ReducBox access suspended: id=${updated.id}`);
    return updated;
  }

  async restoreAccess(accessId: string): Promise<ReducBoxAccessEntity> {
    this.logger.log(`Restoring ReducBox access=${accessId}`);

    const access = await this.requireAccess(accessId);

    if (!access.externalAccessId) {
      throw new Error(`ReducBox access ${accessId} has no external access ID`);
    }

    await this.reducBoxPort.restoreAccess(access.externalAccessId);

    const previousStatus = access.status;
    access.status = ReducBoxAccessStatus.ACTIVE;
    access.restoredAt = new Date();

    const updated = await this.reducBoxAccessRepository.update(access);

    await this.reducBoxAccessRepository.addHistory({
      accessId: updated.id,
      previousStatus,
      newStatus: ReducBoxAccessStatus.ACTIVE,
      reason: 'Access restored',
      changedBy: 'system',
    });

    await this.publishEvent('crm.commercial.reducbox.access.restored', {
      accessId: updated.id,
      clientId: updated.clientId,
      contratId: updated.contratId,
      externalAccessId: updated.externalAccessId,
      previousStatus,
      status: ReducBoxAccessStatus.ACTIVE,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(`ReducBox access restored: id=${updated.id}`);
    return updated;
  }

  private async requireAccess(accessId: string): Promise<ReducBoxAccessEntity> {
    const access = await this.reducBoxAccessRepository.findById(accessId);
    if (!access) {
      throw new Error(`ReducBox access not found: ${accessId}`);
    }
    return access;
  }

  private async publishEvent(subject: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      return;
    }

    await this.natsService.publish(subject, payload);
  }
}
