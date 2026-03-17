import { RetourExpeditionEntity, RetourExpeditionStatus } from '../entities/retour-expedition.entity';

export interface IRetourExpeditionRepository {
  create(params: {
    expeditionId: string;
    reason: string;
  }): Promise<RetourExpeditionEntity>;

  findById(id: string): Promise<RetourExpeditionEntity | null>;

  findByExpeditionId(expeditionId: string): Promise<RetourExpeditionEntity[]>;

  updateStatus(
    id: string,
    status: RetourExpeditionStatus,
    params?: {
      trackingNumber?: string;
      labelUrl?: string;
    },
  ): Promise<RetourExpeditionEntity>;
}
