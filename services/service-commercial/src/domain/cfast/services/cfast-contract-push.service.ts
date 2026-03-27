import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContratEntity } from '../../contrats/entities/contrat.entity';
import { CfastConfigService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastApiClient } from '../../../infrastructure/external/cfast/cfast-api-client';
import { CfastEntityMappingService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';
import { ContractPdfGeneratorService } from './contract-pdf-generator.service';
import { CfastClientPushService } from './cfast-client-push.service';

@Injectable()
export class CfastContractPushService {
  private readonly logger = new Logger(CfastContractPushService.name);

  constructor(
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastApiClient: CfastApiClient,
    private readonly cfastEntityMappingService: CfastEntityMappingService,
    private readonly contractPdfGeneratorService: ContractPdfGeneratorService,
    private readonly cfastClientPushService: CfastClientPushService,
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
  ) {}

  async pushContract(
    organisationId: string,
    contratId: string,
  ): Promise<{ cfastContractId: string }> {
    // 1. Idempotency: return existing mapping if already pushed
    const existingMapping = await this.cfastEntityMappingService.findMapping(
      organisationId,
      'CONTRAT',
      contratId,
      'CONTRACT',
    );

    if (existingMapping) {
      this.logger.log(
        `Contract ${contratId} already pushed to CFAST as ${existingMapping.cfastEntityId}`,
      );
      return { cfastContractId: existingMapping.cfastEntityId };
    }

    // 2. Fetch contrat with line items
    const contrat = await this.contratRepository.findOne({
      where: { id: contratId, organisationId },
      relations: ['lignes'],
    });

    if (!contrat) {
      throw new Error(
        `Contrat ${contratId} not found for organisation ${organisationId}`,
      );
    }

    // 3. Auto-push client to CFAST if no CUSTOMER mapping exists
    const cfastCustomerId = await this.ensureClientPushed(
      organisationId,
      contrat.clientId,
    );

    // 4. Authenticate with CFAST
    const config = await this.cfastConfigService.findByOrganisationId(organisationId);
    if (!config) {
      throw new Error(
        `CFAST config not found for organisation ${organisationId}`,
      );
    }
    const token = await this.cfastApiClient.authenticate(config);

    // 5. Create contract in CFAST
    const cfastContract = await this.cfastApiClient.createContract(
      token,
      cfastCustomerId,
      {
        reference: contrat.reference,
        title: contrat.titre ?? undefined,
        startDate: contrat.dateDebut,
        endDate: contrat.dateFin ?? undefined,
        amount: contrat.montant ?? undefined,
      },
    );

    const cfastContractId = cfastContract.id;
    this.logger.log(
      `Created CFAST contract ${cfastContractId} for CRM contrat ${contratId}`,
    );

    // 6. Generate PDF on-the-fly and upload to CFAST
    const pdfBuffer = await this.contractPdfGeneratorService.generatePdf(contrat);
    const fileName = `contrat-${contrat.reference || contratId}.pdf`;

    await this.cfastApiClient.uploadContractFile(
      token,
      cfastContractId,
      pdfBuffer,
      fileName,
    );

    this.logger.log(
      `Uploaded PDF "${fileName}" to CFAST contract ${cfastContractId}`,
    );

    // 7. Store CONTRAT→CONTRACT mapping
    await this.cfastEntityMappingService.upsertMapping({
      organisationId,
      crmEntityType: 'CONTRAT',
      crmEntityId: contratId,
      cfastEntityType: 'CONTRACT',
      cfastEntityId: cfastContractId,
    });

    return { cfastContractId };
  }

  private async ensureClientPushed(
    organisationId: string,
    clientId: string,
  ): Promise<string> {
    const clientMapping = await this.cfastEntityMappingService.findMapping(
      organisationId,
      'CLIENT',
      clientId,
      'CUSTOMER',
    );

    if (clientMapping) {
      return clientMapping.cfastEntityId;
    }

    this.logger.log(
      `Client ${clientId} not yet in CFAST — auto-pushing before contract`,
    );

    const result = await this.cfastClientPushService.pushClient(
      organisationId,
      clientId,
    );

    return result.cfastCustomerId;
  }
}
