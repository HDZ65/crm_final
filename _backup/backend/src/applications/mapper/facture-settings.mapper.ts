import { Injectable } from '@nestjs/common';
import { FactureSettingsEntity as DomainEntity } from '../../core/domain/facture-settings.entity';
import { FactureSettingsEntity as OrmEntity } from '../../infrastructure/db/entities/facture-settings.entity';
import { FactureSettingsResponseDto } from '../dto/facture-settings/facture-settings-response.dto';

@Injectable()
export class FactureSettingsMapper {
  toDomain(orm: OrmEntity): DomainEntity {
    return new DomainEntity({
      id: orm.id,
      societeId: orm.societeId,
      logoBase64: orm.logoBase64,
      logoMimeType: orm.logoMimeType,
      primaryColor: orm.primaryColor,
      secondaryColor: orm.secondaryColor,
      companyName: orm.companyName,
      companyAddress: orm.companyAddress,
      companyPhone: orm.companyPhone,
      companyEmail: orm.companyEmail,
      companySiret: orm.companySiret,
      companyTvaNumber: orm.companyTvaNumber,
      companyRcs: orm.companyRcs,
      companyCapital: orm.companyCapital,
      iban: orm.iban,
      bic: orm.bic,
      bankName: orm.bankName,
      headerText: orm.headerText,
      footerText: orm.footerText,
      legalMentions: orm.legalMentions,
      paymentTerms: orm.paymentTerms,
      invoicePrefix: orm.invoicePrefix,
      showLogo: orm.showLogo,
      logoPosition: orm.logoPosition,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toPersistence(domain: DomainEntity): Partial<OrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      logoBase64: domain.logoBase64,
      logoMimeType: domain.logoMimeType,
      primaryColor: domain.primaryColor,
      secondaryColor: domain.secondaryColor,
      companyName: domain.companyName,
      companyAddress: domain.companyAddress,
      companyPhone: domain.companyPhone,
      companyEmail: domain.companyEmail,
      companySiret: domain.companySiret,
      companyTvaNumber: domain.companyTvaNumber,
      companyRcs: domain.companyRcs,
      companyCapital: domain.companyCapital,
      iban: domain.iban,
      bic: domain.bic,
      bankName: domain.bankName,
      headerText: domain.headerText,
      footerText: domain.footerText,
      legalMentions: domain.legalMentions,
      paymentTerms: domain.paymentTerms,
      invoicePrefix: domain.invoicePrefix,
      showLogo: domain.showLogo,
      logoPosition: domain.logoPosition,
    };
  }

  toResponse(domain: DomainEntity): FactureSettingsResponseDto {
    return {
      id: domain.id,
      societeId: domain.societeId,
      logoBase64: domain.logoBase64,
      logoMimeType: domain.logoMimeType,
      primaryColor: domain.primaryColor,
      secondaryColor: domain.secondaryColor,
      companyName: domain.companyName,
      companyAddress: domain.companyAddress,
      companyPhone: domain.companyPhone,
      companyEmail: domain.companyEmail,
      companySiret: domain.companySiret,
      companyTvaNumber: domain.companyTvaNumber,
      companyRcs: domain.companyRcs,
      companyCapital: domain.companyCapital,
      iban: domain.iban,
      bic: domain.bic,
      bankName: domain.bankName,
      headerText: domain.headerText,
      footerText: domain.footerText,
      legalMentions: domain.legalMentions,
      paymentTerms: domain.paymentTerms,
      invoicePrefix: domain.invoicePrefix,
      showLogo: domain.showLogo,
      logoPosition: domain.logoPosition,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      hasLogo: domain.hasLogo(),
      logoDataUrl: domain.getLogoDataUrl(),
    };
  }
}
