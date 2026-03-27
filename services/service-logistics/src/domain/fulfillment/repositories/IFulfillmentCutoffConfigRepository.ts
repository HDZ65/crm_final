import { FulfillmentCutoffConfigEntity } from '../entities';

export interface IFulfillmentCutoffConfigRepository {
  create(params: {
    organisationId: string;
    societeId: string;
    cutoffDayOfWeek: number;
    cutoffTime: string;
    timezone: string;
    active: boolean;
  }): Promise<FulfillmentCutoffConfigEntity>;

  findById(id: string): Promise<FulfillmentCutoffConfigEntity | null>;

  findByOrganisationId(organisationId: string): Promise<FulfillmentCutoffConfigEntity[]>;

  findBySocieteId(societeId: string): Promise<FulfillmentCutoffConfigEntity[]>;

  findActiveByOrganisationId(organisationId: string): Promise<FulfillmentCutoffConfigEntity[]>;

  findBySocieteIdAndDayOfWeek(
    societeId: string,
    dayOfWeek: number,
  ): Promise<FulfillmentCutoffConfigEntity | null>;

  update(
    id: string,
    params: {
      cutoffDayOfWeek?: number;
      cutoffTime?: string;
      timezone?: string;
      active?: boolean;
    },
  ): Promise<FulfillmentCutoffConfigEntity>;

  delete(id: string): Promise<void>;
}
