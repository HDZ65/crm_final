import { NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientBaseService } from '../../../persistence/typeorm/repositories/clients/client-base.service';

interface ClientCreateRequest {
  organisation_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  type_client?: string;
  source?: string;
  canal_acquisition?: string;
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

interface ClientCreateResponse {
  client_id: string;
}

@Injectable()
export class ClientCreateHandler implements OnModuleInit {
  private readonly logger = new Logger(ClientCreateHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly clientBaseService: ClientBaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Subscribing to client.create (request-reply)');
    await this.natsService.subscribeAndReply<ClientCreateRequest, ClientCreateResponse>(
      'client.create',
      this.handle.bind(this),
    );
  }

  async handle(request: ClientCreateRequest): Promise<ClientCreateResponse> {
    this.logger.debug(`client.create: org=${request.organisation_id} nom=${request.nom} tel=${request.telephone}`);

    const client = await this.clientBaseService.create({
      keycloakGroupId: request.organisation_id,
      nom: request.nom,
      prenom: request.prenom,
      telephone: request.telephone,
      email: request.email,
      typeClient: request.type_client,
      source: request.source,
      canalAcquisition: request.canal_acquisition,
      civilite: request.civilite,
      dateNaissance: request.date_naissance,
      compteCode: request.compte_code,
      partenaireId: request.partenaire_id,
      statut: request.statut,
      iban: request.iban,
      bic: request.bic,
      mandatSepa: request.mandat_sepa,
      csp: request.csp,
      regimeSocial: request.regime_social,
      lieuNaissance: request.lieu_naissance,
      paysNaissance: request.pays_naissance,
      numss: request.numss,
      isPoliticallyExposed: request.is_politically_exposed,
      etapeCourante: request.etape_courante,
    } as any);

    return { client_id: client.id };
  }
}
