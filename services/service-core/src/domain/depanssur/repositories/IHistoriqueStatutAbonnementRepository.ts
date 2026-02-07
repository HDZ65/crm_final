import { HistoriqueStatutAbonnementEntity } from '../entities/historique-statut-abonnement.entity';

export interface IHistoriqueStatutAbonnementRepository {
  findByAbonnementId(abonnementId: string): Promise<HistoriqueStatutAbonnementEntity[]>;
  save(entity: HistoriqueStatutAbonnementEntity): Promise<HistoriqueStatutAbonnementEntity>;
}
