import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { NatsService } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';
import { ClientBaseService } from '../../../../infrastructure/persistence/typeorm/repositories/clients/client-base.service';

import type {
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  GetClientBaseRequest,
  ListClientsBaseRequest,
  DeleteClientBaseRequest,
  SearchClientRequest,
} from '@crm/proto/clients';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';

@Controller()
export class ClientBaseController {
  constructor(
    private readonly clientBaseService: ClientBaseService,
    private readonly natsService: NatsService,
  ) {}

  @GrpcMethod('ClientBaseService', 'Create')
  async createClientBase(data: CreateClientBaseRequest) {
    const client = await this.clientBaseService.create(data);

    const event: ClientCreatedEvent = {
      eventId: uuidv4(),
      timestamp: Date.now(),
      correlationId: '',
      clientId: client.id,
      organisationId: client.organisationId,
      nom: client.nom,
      prenom: client.prenom || '',
      email: client.email || '',
      createdAt: { seconds: Math.floor(client.dateCreation.getTime() / 1000), nanos: 0 },
    };

    await this.natsService.publishProto(CLIENT_CREATED_SUBJECT, event, ClientCreatedEvent);

    return client;
  }

  @GrpcMethod('ClientBaseService', 'Update')
  async updateClientBase(data: UpdateClientBaseRequest) {
    return this.clientBaseService.update(data);
  }

  @GrpcMethod('ClientBaseService', 'Get')
  async getClientBase(data: GetClientBaseRequest) {
    return this.clientBaseService.findById(data.id);
  }

  @GrpcMethod('ClientBaseService', 'List')
  async listClientsBase(data: ListClientsBaseRequest) {
    return this.clientBaseService.findAll(data);
  }

  @GrpcMethod('ClientBaseService', 'Delete')
  async deleteClientBase(data: DeleteClientBaseRequest) {
    const success = await this.clientBaseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientBaseService', 'Search')
  async searchClient(data: SearchClientRequest) {
    return this.clientBaseService.search(data.organisationId, data.telephone, data.nom);
  }
}
