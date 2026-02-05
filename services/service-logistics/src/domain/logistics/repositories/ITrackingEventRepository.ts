import { TrackingEventEntity } from '../entities';

export interface ITrackingEventRepository {
  create(params: {
    expeditionId: string;
    code: string;
    label: string;
    dateEvenement: string;
    lieu?: string;
    raw?: string;
  }): Promise<TrackingEventEntity>;

  findByExpeditionId(expeditionId: string): Promise<TrackingEventEntity[]>;

  findLatestByExpeditionId(expeditionId: string): Promise<TrackingEventEntity | null>;

  createMultiple(
    expeditionId: string,
    events: Array<{
      code: string;
      label: string;
      dateEvenement: string;
      lieu?: string;
    }>,
  ): Promise<TrackingEventEntity[]>;
}
