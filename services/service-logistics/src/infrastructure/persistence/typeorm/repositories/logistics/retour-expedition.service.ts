import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetourExpeditionEntity, RetourExpeditionStatus } from '../../../../../domain/logistics/entities/retour-expedition.entity';

@Injectable()
export class RetourExpeditionService {
  private readonly logger = new Logger(RetourExpeditionService.name);

  constructor(
    @InjectRepository(RetourExpeditionEntity)
    private readonly retourExpeditionRepository: Repository<RetourExpeditionEntity>,
  ) {}

  async create(params: {
    expeditionId: string;
    reason: string;
  }): Promise<RetourExpeditionEntity> {
    const retourExpedition = this.retourExpeditionRepository.create({
      expeditionId: params.expeditionId,
      reason: params.reason,
      status: RetourExpeditionStatus.DEMANDE,
    });

    return this.retourExpeditionRepository.save(retourExpedition);
  }

  async findById(id: string): Promise<RetourExpeditionEntity | null> {
    return this.retourExpeditionRepository.findOne({ where: { id } });
  }

  async findByExpeditionId(expeditionId: string): Promise<RetourExpeditionEntity[]> {
    return this.retourExpeditionRepository.find({
      where: { expeditionId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    status: RetourExpeditionStatus,
    params?: {
      trackingNumber?: string;
      labelUrl?: string;
    },
  ): Promise<RetourExpeditionEntity> {
    const retourExpedition = await this.findById(id);
    if (!retourExpedition) {
      throw new NotFoundException('Retour expedition not found');
    }

    retourExpedition.status = status;
    if (params?.trackingNumber !== undefined) {
      retourExpedition.trackingNumber = params.trackingNumber;
    }
    if (params?.labelUrl !== undefined) {
      retourExpedition.labelUrl = params.labelUrl;
    }

    return this.retourExpeditionRepository.save(retourExpedition);
  }
}
