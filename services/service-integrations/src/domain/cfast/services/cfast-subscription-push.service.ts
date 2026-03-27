import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CfastApiClient } from '../../../infrastructure/external/cfast/cfast-api-client';
import { CfastConfigService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastEntityMappingService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';
import { ContratEntity } from '../../contrats/entities/contrat.entity';
import { CfastCreateServiceDto } from '../types/cfast-api.types';
import { CfastClientPushService } from './cfast-client-push.service';

@Injectable()
export class CfastSubscriptionPushService {
  private readonly logger = new Logger(CfastSubscriptionPushService.name);

  constructor(
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastApiClient: CfastApiClient,
    private readonly cfastEntityMappingService: CfastEntityMappingService,
    private readonly cfastClientPushService: CfastClientPushService,
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
  ) {}

  /**
   * Assign a CRM contract as a CFAST service (subscription) under the client's CFAST site.
   * This triggers automatic monthly billing in CFAST.
   *
   * Idempotent: returns existing CFAST service ID if mapping already exists.
   * Auto-pushes client hierarchy if no SITE mapping exists.
   */
  async assignSubscription(keycloakGroupId: string, contratId: string): Promise<{ cfastServiceId: string }> {
    // 1. Idempotency: check for existing CONTRAT→SERVICE mapping
    const existingMapping = await this.cfastEntityMappingService.findMapping(
      keycloakGroupId,
      'CONTRAT',
      contratId,
      'SERVICE',
    );

    if (existingMapping) {
      this.logger.log(
        `CONTRAT→SERVICE mapping already exists for contrat ${contratId} → ${existingMapping.cfastEntityId}`,
      );
      return { cfastServiceId: existingMapping.cfastEntityId };
    }

    // 2. Fetch the contrat
    const contrat = await this.contratRepository.findOne({
      where: { id: contratId, keycloakGroupId },
    });

    if (!contrat) {
      throw new Error(`Contrat ${contratId} not found for organisation ${keycloakGroupId}`);
    }

    // 3. Ensure client is pushed to CFAST and get SITE mapping
    const cfastSiteId = await this.ensureClientSite(keycloakGroupId, contrat.clientId);

    // 4. Authenticate with CFAST
    const config = await this.cfastConfigService.findByOrganisationId(keycloakGroupId);
    if (!config) {
      throw new Error(`CFAST config not found for organisation ${keycloakGroupId}`);
    }
    const token = await this.cfastApiClient.authenticate(config);

    // 5. Map CRM contract fields to CFAST service DTO
    const serviceData: CfastCreateServiceDto = {
      name: contrat.titre || contrat.reference,
      code: contrat.reference,
      ...(contrat.montant != null ? { price: Number(contrat.montant) } : {}),
      ...(contrat.frequenceFacturation ? { billingFrequency: contrat.frequenceFacturation } : {}),
    };

    // 6. Create service in CFAST under the site
    const cfastResponse = await this.cfastApiClient.createService(token, cfastSiteId, serviceData);
    const cfastServiceId = cfastResponse.id;

    this.logger.log(`Created CFAST service ${cfastServiceId} for contrat ${contratId} under site ${cfastSiteId}`);

    // 7. Store CONTRAT→SERVICE mapping
    await this.cfastEntityMappingService.upsertMapping({
      keycloakGroupId,
      crmEntityType: 'CONTRAT',
      crmEntityId: contratId,
      cfastEntityType: 'SERVICE',
      cfastEntityId: cfastServiceId,
      metadata: {
        contratReference: contrat.reference,
        contratTitre: contrat.titre,
        cfastSiteId,
        createdAt: new Date().toISOString(),
      },
    });

    return { cfastServiceId };
  }

  /**
   * Ensure the client has a CFAST site. If no CLIENT→SITE mapping exists,
   * push the client hierarchy first (customer → billing-point → site).
   */
  private async ensureClientSite(keycloakGroupId: string, clientId: string): Promise<string> {
    // Check for existing CLIENT→SITE mapping
    let siteMapping = await this.cfastEntityMappingService.findMapping(keycloakGroupId, 'CLIENT', clientId, 'SITE');

    if (siteMapping) {
      return siteMapping.cfastEntityId;
    }

    // No site mapping — push client hierarchy first
    this.logger.log(`No CLIENT→SITE mapping for client ${clientId}, pushing client to CFAST first...`);
    await this.cfastClientPushService.pushClient(keycloakGroupId, clientId);

    // Re-fetch the mapping after push
    siteMapping = await this.cfastEntityMappingService.findMapping(keycloakGroupId, 'CLIENT', clientId, 'SITE');

    if (!siteMapping) {
      throw new Error(`Failed to obtain CFAST site mapping for client ${clientId} after push`);
    }

    return siteMapping.cfastEntityId;
  }
}
