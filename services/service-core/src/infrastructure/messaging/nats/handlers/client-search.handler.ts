import { NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientBaseService } from '../../../persistence/typeorm/repositories/clients/client-base.service';

interface ClientSearchRequest {
  organisation_id: string;
  telephone: string;
  nom: string;
}

interface ClientSearchResponse {
  found: boolean;
  client_id?: string;
}

@Injectable()
export class ClientSearchHandler implements OnModuleInit {
  private readonly logger = new Logger(ClientSearchHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly clientBaseService: ClientBaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Subscribing to client.search (request-reply)');
    await this.natsService.subscribeAndReply<ClientSearchRequest, ClientSearchResponse>(
      'client.search',
      this.handle.bind(this),
    );
  }

  async handle(request: ClientSearchRequest): Promise<ClientSearchResponse> {
    this.logger.debug(`client.search: org=${request.organisation_id} tel=${request.telephone} nom=${request.nom}`);

    const client = await this.clientBaseService.findByPhoneAndName(
      request.telephone,
      request.nom,
      request.organisation_id,
    );

    if (client) {
      return { found: true, client_id: client.id };
    }

    return { found: false };
  }
}
