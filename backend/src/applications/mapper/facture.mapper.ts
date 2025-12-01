import { FactureEntity } from '../../core/domain/facture.entity';
import { FactureEntity as FactureOrmEntity } from '../../infrastructure/db/entities/facture.entity';

export class FactureMapper {
  static toDomain(ormEntity: FactureOrmEntity): FactureEntity {
    return new FactureEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      numero: ormEntity.numero,
      dateEmission: ormEntity.dateEmission,
      montantHT: ormEntity.montantHT,
      montantTTC: ormEntity.montantTTC,
      statutId: ormEntity.statutId,
      emissionFactureId: ormEntity.emissionFactureId,
      clientBaseId: ormEntity.clientBaseId,
      contratId: ormEntity.contratId ?? null,
      clientPartenaireId: ormEntity.clientPartenaireId,
      adresseFacturationId: ormEntity.adresseFacturationId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: FactureEntity): Partial<FactureOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      numero: entity.numero,
      dateEmission: entity.dateEmission,
      montantHT: entity.montantHT,
      montantTTC: entity.montantTTC,
      statutId: entity.statutId,
      emissionFactureId: entity.emissionFactureId,
      clientBaseId: entity.clientBaseId,
      contratId: entity.contratId ?? null,
      clientPartenaireId: entity.clientPartenaireId,
      adresseFacturationId: entity.adresseFacturationId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
