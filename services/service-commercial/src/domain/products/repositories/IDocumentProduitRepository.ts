import { DocumentProduitEntity } from '../entities/document-produit.entity';

export interface IDocumentProduitRepository {
  findById(id: string): Promise<DocumentProduitEntity | null>;
  findByVersion(versionProduitId: string): Promise<DocumentProduitEntity[]>;
  save(entity: DocumentProduitEntity): Promise<DocumentProduitEntity>;
  delete(id: string): Promise<void>;
}
