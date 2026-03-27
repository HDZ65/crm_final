import { NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientBaseService } from '../../../persistence/typeorm/repositories/clients/client-base.service';

interface ClientUpdateRequest {
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

interface ClientUpdateResponse {
  success: boolean;
}

@Injectable()
export class ClientUpdateHandler implements OnModuleInit {
  private readonly logger = new Logger(ClientUpdateHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly clientBaseService: ClientBaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Subscribing to client.update (request-reply)');
    await this.natsService.subscribeAndReply<ClientUpdateRequest, ClientUpdateResponse>(
      'client.update',
      this.handle.bind(this),
    );
  }

  async handle(request: ClientUpdateRequest): Promise<ClientUpdateResponse> {
    this.logger.debug(`client.update: id=${request.client_id}`);

    const hasIdentity = request.nom || request.prenom || request.civilite ||
      request.date_naissance || request.lieu_naissance || request.pays_naissance ||
      request.csp || request.regime_social;

    const hasContact = request.telephone || request.email;

    const hasBanking = request.iban || request.bic || request.mandat_sepa !== undefined;

    const hasCompliance = request.numss !== undefined || request.is_politically_exposed !== undefined;

    const hasAcquisition = request.etape_courante !== undefined;

    await this.clientBaseService.update({
      id: request.client_id,
      statut: request.statut,
      compteCode: request.compte_code,
      partenaireId: request.partenaire_id,
      identity: hasIdentity
        ? {
            nom: request.nom ?? '',
            prenom: request.prenom ?? '',
            civilite: request.civilite as any ?? 0,
            dateNaissance: request.date_naissance ? { seconds: String(new Date(request.date_naissance).getTime() / 1000), nanos: 0 } as any : undefined,
            lieuNaissance: request.lieu_naissance ?? '',
            paysNaissance: request.pays_naissance ?? '',
            profession: '',
            csp: request.csp ?? '',
            regimeSocial: request.regime_social ?? '',
          }
        : undefined,
      contact: hasContact
        ? {
            telephone: request.telephone ?? '',
            email: request.email ?? '',
            langue: '',
          }
        : undefined,
      banking: hasBanking
        ? {
            iban: request.iban ?? '',
            bic: request.bic ?? '',
            mandatSepa: request.mandat_sepa ?? false,
            mandatSepaReference: '',
          }
        : undefined,
      compliance: hasCompliance
        ? {
            isPoliticallyExposed: request.is_politically_exposed ?? false,
            numss: request.numss ?? '',
            numOrganisme: '',
            kycStatus: 0 as any,
            gdprConsent: false,
          }
        : undefined,
      acquisition: hasAcquisition
        ? {
            etapeCourante: request.etape_courante ?? '',
            canalAcquisition: '',
            source: '',
          }
        : undefined,
    });

    return { success: true };
  }
}
