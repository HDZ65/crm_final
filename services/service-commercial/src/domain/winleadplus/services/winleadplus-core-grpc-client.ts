import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';

// ===== TYPE CONTRACTS =====

interface SearchClientRequest {
  organisation_id: string;
  telephone: string;
  nom: string;
}

interface CreateClientRequest {
  organisation_id: string;
  type_client: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  compte_code: string;
  partenaire_id: string;
  telephone: string;
  email?: string;
  statut: string;
  canal_acquisition?: string;
  source?: string;
  iban?: string;
  mandat_sepa?: boolean;
  civilite?: string;
  bic?: string;
  csp?: string;
  regime_social?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  etape_courante?: string;
  is_politically_exposed?: boolean;
  numss?: string;
}

interface UpdateClientRequest {
  id: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  compte_code?: string;
  partenaire_id?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  canal_acquisition?: string;
  source?: string;
  iban?: string;
  mandat_sepa?: boolean;
  civilite?: string;
  bic?: string;
  csp?: string;
  regime_social?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  etape_courante?: string;
  is_politically_exposed?: boolean;
  numss?: string;
}

interface ClientBaseResponse {
  id: string;
  updated_at?: string;
}

interface SearchClientResponse {
  found: boolean;
  client?: ClientBaseResponse;
}

interface CreateAdresseRequest {
  client_base_id: string;
  ligne1: string;
  ligne2?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  type: string;
}

interface AdresseResponse {
  id: string;
}

interface DeleteClientRequest {
  id: string;
}

interface DeleteResponse {
  success: boolean;
}

interface ClientBaseServiceGrpcContract {
  Search(
    request: SearchClientRequest,
    callback: (error: ServiceError | null, response?: SearchClientResponse) => void,
  ): void;
  Create(
    request: CreateClientRequest,
    callback: (error: ServiceError | null, response?: ClientBaseResponse) => void,
  ): void;
  Update(
    request: UpdateClientRequest,
    callback: (error: ServiceError | null, response?: ClientBaseResponse) => void,
  ): void;
  Delete(
    request: DeleteClientRequest,
    callback: (error: ServiceError | null, response?: DeleteResponse) => void,
  ): void;
}

interface AdresseServiceGrpcContract {
  Create(
    request: CreateAdresseRequest,
    callback: (error: ServiceError | null, response?: AdresseResponse) => void,
  ): void;
}

// ===== GRPC CLIENT =====

export class WinLeadPlusCoreGrpcClient {
  private readonly clientBaseService: ClientBaseServiceGrpcContract;
  private readonly adresseService: AdresseServiceGrpcContract;

  constructor() {
    const grpcPackage = loadGrpcPackage('clients');
    const url =
      process.env.CLIENTS_GRPC_URL ||
      process.env.SERVICE_CORE_GRPC_URL ||
      getServiceUrl('clients');

    const ClientBaseConstructor = grpcPackage?.clients?.ClientBaseService;
    if (!ClientBaseConstructor) {
      throw new Error('ClientBaseService gRPC constructor not found in clients proto package');
    }
    this.clientBaseService = new ClientBaseConstructor(url, credentials.createInsecure());

    const AdresseConstructor = grpcPackage?.clients?.AdresseService;
    if (!AdresseConstructor) {
      throw new Error('AdresseService gRPC constructor not found in clients proto package');
    }
    this.adresseService = new AdresseConstructor(url, credentials.createInsecure());
  }

  async search(request: SearchClientRequest): Promise<SearchClientResponse> {
    return new Promise<SearchClientResponse>((resolve, reject) => {
      this.clientBaseService.Search(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response || { found: false });
      });
    });
  }

  async create(request: CreateClientRequest): Promise<ClientBaseResponse> {
    return new Promise<ClientBaseResponse>((resolve, reject) => {
      this.clientBaseService.Create(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response) {
          reject(new Error('ClientBase create returned empty response'));
          return;
        }
        resolve(response);
      });
    });
  }

  async update(request: UpdateClientRequest): Promise<ClientBaseResponse> {
    return new Promise<ClientBaseResponse>((resolve, reject) => {
      this.clientBaseService.Update(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response) {
          reject(new Error('ClientBase update returned empty response'));
          return;
        }
        resolve(response);
      });
    });
  }

  async createAdresse(request: CreateAdresseRequest): Promise<AdresseResponse> {
    return new Promise<AdresseResponse>((resolve, reject) => {
      this.adresseService.Create(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response) {
          reject(new Error('Adresse create returned empty response'));
          return;
        }
        resolve(response);
      });
    });
  }

  async deleteClient(request: DeleteClientRequest): Promise<DeleteResponse> {
    return new Promise<DeleteResponse>((resolve, reject) => {
      this.clientBaseService.Delete(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response || { success: false });
      });
    });
  }
}
