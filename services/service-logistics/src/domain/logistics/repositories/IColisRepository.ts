import { ColisEntity } from '../entities';

export interface IColisRepository {
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
