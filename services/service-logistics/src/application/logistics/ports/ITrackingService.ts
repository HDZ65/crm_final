import { TrackingEventEntity } from '../../../domain/logistics/entities';

export const TRACKING_SERVICE = Symbol('TRACKING_SERVICE');

export interface ITrackingService {
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
