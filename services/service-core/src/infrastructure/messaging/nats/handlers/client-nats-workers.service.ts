import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { ClientBaseService } from '../../../persistence/typeorm/repositories/clients';
import type { CreateClientBaseRequest, UpdateClientBaseRequest } from '@proto/clients';

interface ClientCreateNatsMessage {
  organisation_id: string;
  type_client: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string;
  statut?: string;
  compte_code: string;
  partenaire_id: string;
  societe_id?: string;
  source?: string;
  iban?: string;
  mandat_sepa?: boolean;
  adresse?: {
    rue?: string;
    codePostal?: string;
    ville?: string;
  };
  commercial_id?: string;
  [key: string]: any;
}

interface ClientUpdateNatsMessage {
  id: string;
  organisation_id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  statut?: string;
  source?: string;
  iban?: string;
  mandat_sepa?: boolean;
  [key: string]: any;
}

/**
 * NATS consumers for client creation/update events from external sources (e.g., WinLeadPlus).
 * Listens on:
 * - client.create.from-winleadplus: Create new client with source tracking
 * - client.update.from-winleadplus: Update existing client preserving source
 */
@Injectable()
export class ClientNatsWorkersService implements OnModuleInit {
  private readonly logger = new Logger(ClientNatsWorkersService.name);

  constructor(
    private readonly clientBaseService: ClientBaseService,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.natsService) {
      this.logger.warn('NATS not available, client NATS workers will not start');
      return;
    }

    await this.registerWorkers();
  }

  private async registerWorkers(): Promise<void> {
    if (!this.natsService) return;

    // Worker 1: Client Create from WinLeadPlus
    await this.natsService.subscribe<ClientCreateNatsMessage>(
      'client.create.from-winleadplus',
      async (data) => this.handleClientCreate(data),
    );

    // Worker 2: Client Update from WinLeadPlus
    await this.natsService.subscribe<ClientUpdateNatsMessage>(
      'client.update.from-winleadplus',
      async (data) => this.handleClientUpdate(data),
    );

    this.logger.log('Client NATS workers registered (2 consumers)');
  }

  /**
   * Worker 1: client.create.from-winleadplus
   * Create new client with source field set to "WinLeadPlus"
   */
  async handleClientCreate(data: ClientCreateNatsMessage): Promise<void> {
    this.logger.log(`Processing client.create.from-winleadplus: ${data.nom} ${data.prenom}`);

    try {
      const createRequest: CreateClientBaseRequest = {
        organisation_id: data.organisation_id,
        type_client: data.type_client,
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: '',
        email: data.email || '',
        telephone: data.telephone,
        statut: data.statut || 'ACTIF',
        compte_code: data.compte_code,
        partenaire_id: data.partenaire_id,
        societe_id: data.societe_id,
        source: data.source || 'WinLeadPlus',
      };

      const createdClient = await this.clientBaseService.create(createRequest);

      this.logger.log(
        `Client created from WinLeadPlus: id=${createdClient.id}, nom=${createdClient.nom}, source=${createdClient.source}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create client from WinLeadPlus (${data.nom} ${data.prenom}): ${error}`,
      );
      throw error;
    }
  }

  /**
   * Worker 2: client.update.from-winleadplus
   * Update existing client, preserving source field
   */
  async handleClientUpdate(data: ClientUpdateNatsMessage): Promise<void> {
    this.logger.log(`Processing client.update.from-winleadplus: ${data.id}`);

    try {
      // First, fetch the existing client to preserve source
      const existingClient = await this.clientBaseService.findById(data.id);

      const updateRequest: UpdateClientBaseRequest = {
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        statut: data.statut,
        // Preserve existing source if not explicitly provided
        source: data.source || existingClient.source || undefined,
      };

      const updatedClient = await this.clientBaseService.update(updateRequest);

      this.logger.log(
        `Client updated from WinLeadPlus: id=${updatedClient.id}, nom=${updatedClient.nom}, source=${updatedClient.source}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update client from WinLeadPlus (${data.id}): ${error}`);
      throw error;
    }
  }
}
