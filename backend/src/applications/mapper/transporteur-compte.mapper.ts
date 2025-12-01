import { TransporteurCompteEntity } from '../../core/domain/transporteur-compte.entity';
import { TransporteurCompteEntity as TransporteurCompteOrmEntity } from '../../infrastructure/db/entities/transporteur-compte.entity';

export class TransporteurCompteMapper {
  static toDomain(
    ormEntity: TransporteurCompteOrmEntity,
  ): TransporteurCompteEntity {
    return new TransporteurCompteEntity({
      id: ormEntity.id,
      type: ormEntity.type,
      organisationId: ormEntity.organisationId,
      contractNumber: ormEntity.contractNumber,
      password: ormEntity.password,
      labelFormat: ormEntity.labelFormat,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: TransporteurCompteEntity,
  ): Partial<TransporteurCompteOrmEntity> {
    return {
      id: entity.id,
      type: entity.type,
      organisationId: entity.organisationId,
      contractNumber: entity.contractNumber,
      password: entity.password,
      labelFormat: entity.labelFormat,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
