import { ContratEntity } from '../../core/domain/contrat.entity';
import { ContratEntity as ContratOrmEntity } from '../../infrastructure/db/entities/contrat.entity';

export class ContratMapper {
  static toDomain(ormEntity: ContratOrmEntity): ContratEntity {
    return new ContratEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      reference: ormEntity.reference,
      titre: ormEntity.titre ?? null,
      description: ormEntity.description ?? null,
      type: ormEntity.type ?? null,
      statut: ormEntity.statut,
      dateDebut: ormEntity.dateDebut,
      dateFin: ormEntity.dateFin ?? null,
      dateSignature: ormEntity.dateSignature ?? null,
      montant: ormEntity.montant ? Number(ormEntity.montant) : null,
      devise: ormEntity.devise ?? null,
      frequenceFacturation: ormEntity.frequenceFacturation ?? null,
      documentUrl: ormEntity.documentUrl ?? null,
      fournisseur: ormEntity.fournisseur ?? null,
      clientId: ormEntity.clientId,
      commercialId: ormEntity.commercialId,
      notes: ormEntity.notes ?? null,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ContratEntity): Partial<ContratOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      reference: entity.reference,
      titre: entity.titre ?? undefined,
      description: entity.description ?? undefined,
      type: entity.type ?? undefined,
      statut: entity.statut,
      dateDebut: entity.dateDebut,
      dateFin: entity.dateFin ?? undefined,
      dateSignature: entity.dateSignature ?? undefined,
      montant: entity.montant ?? undefined,
      devise: entity.devise ?? undefined,
      frequenceFacturation: entity.frequenceFacturation ?? undefined,
      documentUrl: entity.documentUrl ?? undefined,
      fournisseur: entity.fournisseur ?? undefined,
      clientId: entity.clientId,
      commercialId: entity.commercialId,
      notes: entity.notes ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
