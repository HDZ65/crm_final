import { EmerchantpayAccountEntity } from '../../core/domain/emerchantpay-account.entity';
import { EmerchantpayAccountEntity as EmerchantpayAccountOrmEntity } from '../../infrastructure/db/entities/emerchantpay-account.entity';

export class EmerchantpayAccountMapper {
  static toDomain(orm: EmerchantpayAccountOrmEntity): EmerchantpayAccountEntity {
    return new EmerchantpayAccountEntity({
      id: orm.id,
      societeId: orm.societeId,
      nom: orm.nom,
      username: orm.username,
      password: orm.password,
      terminalToken: orm.terminalToken,
      environment: orm.environment,
      actif: orm.actif,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: EmerchantpayAccountEntity): Partial<EmerchantpayAccountOrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      nom: domain.nom,
      username: domain.username,
      password: domain.password,
      terminalToken: domain.terminalToken,
      environment: domain.environment,
      actif: domain.actif,
    };
  }
}
