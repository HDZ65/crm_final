import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TransporteurCompteService } from '../../../../infrastructure/persistence/typeorm/repositories/clients/transporteur-compte.service';
import type {
  CreateTransporteurCompteRequest,
  UpdateTransporteurCompteRequest,
  GetTransporteurCompteRequest,
  ListTransporteurByOrganisationRequest,
  ListTransporteurCompteRequest,
  ActivateTransporteurRequest,
  DeleteTransporteurCompteRequest,
} from '@crm/proto/referentiel';

@Controller()
export class TransporteurCompteController {
  constructor(private readonly transporteurCompteService: TransporteurCompteService) {}

  @GrpcMethod('TransporteurCompteService', 'Create')
  create(data: CreateTransporteurCompteRequest) {
    return this.transporteurCompteService.create(data);
  }

  @GrpcMethod('TransporteurCompteService', 'Update')
  update(data: UpdateTransporteurCompteRequest) {
    const { id, ...updateData } = data;
    return this.transporteurCompteService.update(id, updateData);
  }

  @GrpcMethod('TransporteurCompteService', 'Get')
  get(data: GetTransporteurCompteRequest) {
    return this.transporteurCompteService.findById(data.id);
  }

  @GrpcMethod('TransporteurCompteService', 'ListByOrganisation')
  listByOrganisation(data: ListTransporteurByOrganisationRequest) {
    return this.transporteurCompteService.findByOrganisation(data.organisation_id, data.actif, data.pagination);
  }

  @GrpcMethod('TransporteurCompteService', 'List')
  list(data: ListTransporteurCompteRequest) {
    return this.transporteurCompteService.findAll({ type: data.type, actif: data.actif }, data.pagination);
  }

  @GrpcMethod('TransporteurCompteService', 'Activer')
  activer(data: ActivateTransporteurRequest) {
    return this.transporteurCompteService.activer(data.id);
  }

  @GrpcMethod('TransporteurCompteService', 'Desactiver')
  desactiver(data: ActivateTransporteurRequest) {
    return this.transporteurCompteService.desactiver(data.id);
  }

  @GrpcMethod('TransporteurCompteService', 'Delete')
  delete(data: DeleteTransporteurCompteRequest) {
    return this.transporteurCompteService.delete(data.id);
  }
}
