import type { BaseRepositoryPort } from './repository.port';
import type { BoiteMailEntity } from '../domain/boite-mail.entity';

export interface BoiteMailRepositoryPort
  extends BaseRepositoryPort<BoiteMailEntity> {
  findByUtilisateurId(utilisateurId: string): Promise<BoiteMailEntity[]>;
  findDefaultByUtilisateurId(
    utilisateurId: string,
  ): Promise<BoiteMailEntity | null>;
}
