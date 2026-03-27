import { NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AdresseService } from '../../../persistence/typeorm/repositories/clients/adresse.service';

interface AdresseCreateRequest {
  client_id: string;
  ligne1: string;
  ligne2?: string;
  code_postal: string;
  ville: string;
  pays?: string;
  type: string;
}

interface AdresseCreateResponse {
  adresse_id: string;
}

@Injectable()
export class AdresseCreateHandler implements OnModuleInit {
  private readonly logger = new Logger(AdresseCreateHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly adresseService: AdresseService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Subscribing to adresse.create (request-reply)');
    await this.natsService.subscribeAndReply<AdresseCreateRequest, AdresseCreateResponse>(
      'adresse.create',
      this.handle.bind(this),
    );
  }

  async handle(request: AdresseCreateRequest): Promise<AdresseCreateResponse> {
    this.logger.debug(`adresse.create: clientId=${request.client_id} type=${request.type}`);

    const adresse = await this.adresseService.create({
      clientBaseId: request.client_id,
      ligne1: request.ligne1,
      ligne2: request.ligne2,
      codePostal: request.code_postal,
      ville: request.ville,
      pays: request.pays,
      type: request.type,
    });

    return { adresse_id: adresse.id };
  }
}
