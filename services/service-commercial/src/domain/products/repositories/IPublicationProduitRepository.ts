import { PublicationProduitEntity } from '../entities/publication-produit.entity';

export interface IPublicationProduitRepository {
  findById(id: string): Promise<PublicationProduitEntity | null>;
  findByVersion(versionProduitId: string): Promise<PublicationProduitEntity[]>;
  findBySociete(societeId: string): Promise<PublicationProduitEntity[]>;
  save(entity: PublicationProduitEntity): Promise<PublicationProduitEntity>;
  delete(id: string): Promise<void>;
}
