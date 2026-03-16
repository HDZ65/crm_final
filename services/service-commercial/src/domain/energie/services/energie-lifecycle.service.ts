import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  type EnergiePartenairePort,
  PLENITUDE_PORT,
  OHM_PORT,
} from '../ports/energie-partenaire.port';
import { RaccordementEnergieRepositoryService } from '../../../infrastructure/persistence/typeorm/repositories/energie';
import {
  RaccordementEnergieEntity,
  PartenaireEnergie,
  StatutRaccordement,
} from '../entities/raccordement-energie.entity';

@Injectable()
export class EnergieLifecycleService {
  private readonly logger = new Logger(EnergieLifecycleService.name);

  constructor(
    @Inject(PLENITUDE_PORT)
    private readonly plenitudePort: EnergiePartenairePort,
    @Inject(OHM_PORT)
    private readonly ohmPort: EnergiePartenairePort,
    private readonly raccordementRepository: RaccordementEnergieRepositoryService,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async createRaccordement(
    clientId: string,
    contratId: string,
    partenaire: PartenaireEnergie,
    adresse?: string,
  ): Promise<RaccordementEnergieEntity> {
    this.logger.log(
      `Creating raccordement for client=${clientId}, contrat=${contratId}, partenaire=${partenaire}`,
    );

    const port = this.selectPort(partenaire);
    const { raccordementId: externalId } = await port.createRaccordement({
      clientId,
      contratId,
      adresse,
    });

    const entity = await this.raccordementRepository.create({
      clientId,
      contratId,
      partenaire,
      statutRaccordement: StatutRaccordement.DEMANDE_ENVOYEE,
      adresse: adresse ?? null,
      dateDemande: new Date(),
      metadata: { externalId },
    });

    await this.raccordementRepository.addHistory({
      raccordementId: entity.id,
      previousStatus: '',
      newStatus: StatutRaccordement.DEMANDE_ENVOYEE,
      source: `partenaire:${partenaire}`,
    });

    await this.publishEvent('crm.commercial.energie.raccordement.created', {
      raccordementId: entity.id,
      clientId,
      contratId,
      partenaire,
      externalId,
      status: StatutRaccordement.DEMANDE_ENVOYEE,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(
      `Raccordement created: id=${entity.id}, externalId=${externalId}`,
    );
    return entity;
  }

  async updateStatus(
    raccordementId: string,
    newStatus: StatutRaccordement,
  ): Promise<RaccordementEnergieEntity> {
    this.logger.log(
      `Updating status for raccordement=${raccordementId} to ${newStatus}`,
    );

    const entity = await this.raccordementRepository.findById(raccordementId);
    const previousStatus = entity.statutRaccordement;

    const updated = await this.raccordementRepository.update(raccordementId, {
      statutRaccordement: newStatus,
    });

    await this.raccordementRepository.addHistory({
      raccordementId: updated.id,
      previousStatus,
      newStatus,
      source: 'system',
    });

    await this.publishEvent('crm.commercial.energie.status.changed', {
      raccordementId: updated.id,
      clientId: updated.clientId,
      contratId: updated.contratId,
      partenaire: updated.partenaire,
      previousStatus,
      newStatus,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(`Raccordement ${raccordementId} status updated: ${previousStatus} -> ${newStatus}`);
    return updated;
  }

  async activateSupply(raccordementId: string): Promise<RaccordementEnergieEntity> {
    this.logger.log(`Activating supply for raccordement=${raccordementId}`);

    const entity = await this.raccordementRepository.findById(raccordementId);
    const port = this.selectPort(entity.partenaire);

    const externalId = (entity.metadata as Record<string, unknown> | null)?.externalId as string | undefined;
    if (externalId) {
      await port.activateSupply(externalId);
    }

    const previousStatus = entity.statutRaccordement;
    const updated = await this.raccordementRepository.update(raccordementId, {
      statutRaccordement: StatutRaccordement.ACTIVE,
      dateActivation: new Date(),
    });

    await this.raccordementRepository.addHistory({
      raccordementId: updated.id,
      previousStatus,
      newStatus: StatutRaccordement.ACTIVE,
      source: `partenaire:${entity.partenaire}`,
    });

    await this.publishEvent('crm.commercial.energie.activated', {
      raccordementId: updated.id,
      clientId: updated.clientId,
      contratId: updated.contratId,
      partenaire: updated.partenaire,
      previousStatus,
      status: StatutRaccordement.ACTIVE,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(`Raccordement ${raccordementId} supply activated`);
    return updated;
  }

  private selectPort(partenaire: PartenaireEnergie): EnergiePartenairePort {
    switch (partenaire) {
      case PartenaireEnergie.PLENITUDE:
        return this.plenitudePort;
      case PartenaireEnergie.OHM:
        return this.ohmPort;
      default:
        throw new Error(`Unknown partenaire: ${partenaire}`);
    }
  }

  private async publishEvent(subject: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      return;
    }

    await this.natsService.publish(subject, payload);
  }
}
