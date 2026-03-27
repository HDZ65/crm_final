import { NatsRemoteError, NatsService } from '@crm/shared-kernel';
import { Injectable, Logger } from '@nestjs/common';

// ===== TYPE CONTRACTS =====
// Preserved from WinLeadPlusCoreGrpcClient for drop-in replacement

interface SearchClientRequest {
  organisation_id: string;
  telephone: string;
  nom: string;
}

interface SearchClientResponse {
  found: boolean;
  client_id?: string;
}

interface CreateClientRequest {
  organisation_id: string;
  type_client?: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  canal_acquisition?: string;
  source?: string;
  civilite?: string;
  date_naissance?: string;
  compte_code?: string;
  partenaire_id?: string;
  statut?: string;
  iban?: string;
  bic?: string;
  mandat_sepa?: boolean;
  csp?: string;
  regime_social?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  numss?: string;
  num_organisme?: string;
  is_politically_exposed?: boolean;
  etape_courante?: string;
}

interface CreateClientResponse {
  client_id: string;
}

interface UpdateClientRequest {
  client_id: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  civilite?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  csp?: string;
  regime_social?: string;
  numss?: string;
  num_organisme?: string;
  is_politically_exposed?: boolean;
  etape_courante?: string;
  iban?: string;
  bic?: string;
  mandat_sepa?: boolean;
  compte_code?: string;
  partenaire_id?: string;
}

interface UpdateClientResponse {
  success: boolean;
}

interface CreateAdresseRequest {
  client_id: string;
  ligne1: string;
  ligne2?: string;
  code_postal: string;
  ville: string;
  pays?: string;
  type: string;
}

interface CreateAdresseResponse {
  adresse_id: string;
}

interface DeleteClientRequest {
  client_id: string;
}

interface DeleteClientResponse {
  success: boolean;
}

// Re-export NatsRemoteError for consumers to catch business errors
export { NatsRemoteError };

@Injectable()
export class CoreClientService {
  private readonly logger = new Logger(CoreClientService.name);

  constructor(private readonly natsService: NatsService) {}

  async search(request: SearchClientRequest): Promise<SearchClientResponse> {
    this.logger.debug(`NATS request client.search: tel=${request.telephone}`);

    return this.natsService.request<SearchClientRequest, SearchClientResponse>('client.search', request, {
      timeout: 5000,
      retries: 2,
      retryDelay: 500,
    });
  }

  async create(request: CreateClientRequest): Promise<CreateClientResponse> {
    this.logger.debug(`NATS request client.create: nom=${request.nom}`);

    return this.natsService.request<CreateClientRequest, CreateClientResponse>('client.create', request, {
      timeout: 10000,
    });
  }

  async update(request: UpdateClientRequest): Promise<UpdateClientResponse> {
    this.logger.debug(`NATS request client.update: id=${request.client_id}`);

    return this.natsService.request<UpdateClientRequest, UpdateClientResponse>('client.update', request, {
      timeout: 5000,
    });
  }

  async createAdresse(request: CreateAdresseRequest): Promise<CreateAdresseResponse> {
    this.logger.debug(`NATS request adresse.create: clientId=${request.client_id}`);

    return this.natsService.request<CreateAdresseRequest, CreateAdresseResponse>('adresse.create', request, {
      timeout: 5000,
    });
  }

  async deleteClient(request: DeleteClientRequest): Promise<DeleteClientResponse> {
    this.logger.debug(`NATS request client.delete: id=${request.client_id}`);

    return this.natsService.request<DeleteClientRequest, DeleteClientResponse>('client.delete', request, {
      timeout: 5000,
    });
  }
}
