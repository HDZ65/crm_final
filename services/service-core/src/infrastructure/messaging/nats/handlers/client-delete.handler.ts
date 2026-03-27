import { NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientBaseService } from '../../../persistence/typeorm/repositories/clients/client-base.service';

interface ClientDeleteRequest {
  client_id: string;
}

interface ClientDeleteResponse {
  success: boolean;
}

@Injectable()
export class ClientDeleteHandler implements OnModuleInit {
  private readonly logger = new Logger(ClientDeleteHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly clientBaseService: ClientBaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Subscribing to client.delete (request-reply)');
    await this.natsService.subscribeAndReply<ClientDeleteRequest, ClientDeleteResponse>(
      'client.delete',
      this.handle.bind(this),
    );
  }

  async handle(request: ClientDeleteRequest): Promise<ClientDeleteResponse> {
    this.logger.debug(`client.delete: id=${request.client_id}`);

    const success = await this.clientBaseService.delete(request.client_id);

    return { success };
  }
}
