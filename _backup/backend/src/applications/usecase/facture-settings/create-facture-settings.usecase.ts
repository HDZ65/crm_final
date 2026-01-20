import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { FactureSettingsEntity } from '../../../core/domain/facture-settings.entity';
import type { FactureSettingsRepositoryPort } from '../../../core/port/facture-settings-repository.port';
import { CreateFactureSettingsDto } from '../../dto/facture-settings/create-facture-settings.dto';

@Injectable()
export class CreateFactureSettingsUseCase {
  constructor(
    @Inject('FactureSettingsRepositoryPort')
    private readonly repository: FactureSettingsRepositoryPort,
  ) {}

  async execute(dto: CreateFactureSettingsDto): Promise<FactureSettingsEntity> {
    // Vérifier qu'il n'existe pas déjà de settings pour cette société
    const existing = await this.repository.findBySocieteId(dto.societeId);
    if (existing) {
      throw new ConflictException(
        `Des paramètres de facturation existent déjà pour cette société`,
      );
    }

    const entity = new FactureSettingsEntity({
      societeId: dto.societeId,
      logoBase64: dto.logoBase64,
      logoMimeType: dto.logoMimeType,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      companyName: dto.companyName,
      companyAddress: dto.companyAddress,
      companyPhone: dto.companyPhone,
      companyEmail: dto.companyEmail,
      companySiret: dto.companySiret,
      companyTvaNumber: dto.companyTvaNumber,
      companyRcs: dto.companyRcs,
      companyCapital: dto.companyCapital,
      iban: dto.iban,
      bic: dto.bic,
      bankName: dto.bankName,
      headerText: dto.headerText,
      footerText: dto.footerText,
      legalMentions: dto.legalMentions,
      paymentTerms: dto.paymentTerms,
      invoicePrefix: dto.invoicePrefix,
      showLogo: dto.showLogo,
      logoPosition: dto.logoPosition,
    });

    return this.repository.create(entity);
  }
}
