import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { credentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import type {
  CreateOrganisationRequest as ProtoCreateOrganisationRequest,
  Organisation as ProtoOrganisation,
} from '@proto/organisations/organisations';

type CreateOrganisationRequest = Partial<ProtoCreateOrganisationRequest>;
type Organisation = ProtoOrganisation;

@Injectable()
export class OrganisationsClientService implements OnModuleInit {
  private readonly logger = new Logger(OrganisationsClientService.name);
  private organisationService: any;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('ORGANISATIONS_GRPC_URL', 'service-organisations:50062');
    
    // Try Docker path first, then dev path
    const dockerProtoPath = join(process.cwd(), 'proto/organisations.proto');
    const devProtoPath = join(process.cwd(), 'proto/src/organisations/organisations.proto');
    
    const fs = require('fs');
    const protoPath = fs.existsSync(dockerProtoPath) ? dockerProtoPath : devProtoPath;
    const includeDirs = fs.existsSync(dockerProtoPath) 
      ? [join(process.cwd(), 'proto')]
      : [join(process.cwd(), 'proto/src')];

    try {
      const packageDef = loadSync(protoPath, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs,
      });

      const grpcObj = loadPackageDefinition(packageDef) as any;
      this.organisationService = new grpcObj.organisations.OrganisationService(
        url,
        credentials.createInsecure()
      );
      this.logger.log(`Connected to organisations service at ${url}`);
    } catch (error) {
      this.logger.error(`Failed to connect to organisations service: ${error}`);
    }
  }

  /**
   * Create an organisation with a specific ID (to match compte ID)
   */
  async createOrganisation(request: CreateOrganisationRequest): Promise<Organisation> {
    return new Promise((resolve, reject) => {
      if (!this.organisationService) {
        reject(new Error('Organisations service not connected'));
        return;
      }

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
