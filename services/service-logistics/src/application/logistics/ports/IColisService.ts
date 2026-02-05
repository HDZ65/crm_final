import { ColisEntity } from '../../../domain/logistics/entities';

export const COLIS_SERVICE = Symbol('COLIS_SERVICE');

export interface IColisService {
  create(params: {
    expeditionId: string;
    poidsGr: number;
    longCm: number;
    largCm: number;
    hautCm: number;
    valeurDeclaree: number;
    contenu: string;
  }): Promise<ColisEntity>;

  findById(id: string): Promise<ColisEntity | null>;

  findByExpeditionId(expeditionId: string): Promise<ColisEntity[]>;

  update(
    id: string,
    params: {
      poidsGr?: number;
      longCm?: number;
      largCm?: number;
      hautCm?: number;
      valeurDeclaree?: number;
      contenu?: string;
    },
  ): Promise<ColisEntity>;

  delete(id: string): Promise<void>;
}
