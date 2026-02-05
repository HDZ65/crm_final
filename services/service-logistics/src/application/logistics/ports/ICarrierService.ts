import { CarrierAccountEntity } from '../../../domain/logistics/entities';

export const CARRIER_SERVICE = Symbol('CARRIER_SERVICE');

export interface ICarrierService {
  create(params: {
    organisationId: string;
    type: string;
    contractNumber: string;
    password: string;
    labelFormat: string;
    actif: boolean;
  }): Promise<CarrierAccountEntity>;

  findById(id: string): Promise<CarrierAccountEntity | null>;

  findByOrganisationId(organisationId: string): Promise<CarrierAccountEntity[]>;

  findActiveByOrganisationId(organisationId: string): Promise<CarrierAccountEntity[]>;

  findMailevaAccount(organisationId: string): Promise<CarrierAccountEntity | null>;

  update(
    id: string,
    params: {
      contractNumber?: string;
      password?: string;
      labelFormat?: string;
      actif?: boolean;
    },
  ): Promise<CarrierAccountEntity>;

  delete(id: string): Promise<void>;
}
