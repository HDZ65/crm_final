import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGrpcClient, getGrpcClientConfig } from '@crm/grpc-utils';
import type {
  CreateOrganisationRequest,
  Organisation,
} from '@crm/proto/organisations';

@Injectable()
export class OrganisationsClientService implements OnModuleInit {
  private readonly logger = new Logger(OrganisationsClientService.name);
  private organisationService: any = null;
  private serviceUrl: string = '';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.serviceUrl = this.configService.get<string>('ORGANISATIONS_GRPC_URL', 'service-organisations:50062');

    try {
      this.organisationService = createGrpcClient(
        'organisations',
        'OrganisationService',
        { url: this.serviceUrl }
      );
      this.logger.log(`Connected to organisations service at ${this.serviceUrl}`);
    } catch (error) {
      this.logger.error(`Failed to connect to organisations service: ${error}`);
    }
  }

  /**
   * Create an organisation
   */
  async createOrganisation(request: Partial<CreateOrganisationRequest>): Promise<Organisation> {
    if (!this.organisationService) {
      throw new Error('Organisations service not connected');
    }

    return new Promise((resolve, reject) => {
      this.organisationService.create(request, (error: any, response: Organisation) => {
        if (error) {
          this.logger.error(`Failed to create organisation: ${error.message}`);
          reject(error);
        } else {
          this.logger.log(`Created organisation ${response.id}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * Create organisation with same ID as compte for synchronization
   */
  async syncOrganisationWithCompte(compteId: string, nom: string): Promise<Organisation> {
    return this.createOrganisation({
      id: compteId,
      nom,
      actif: true,
    });
  }
}
