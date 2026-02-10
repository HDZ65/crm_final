import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AdresseService } from '../../persistence/typeorm/repositories/clients/adresse.service';
import type {
  CreateAdresseRequest,
  UpdateAdresseRequest,
  GetAdresseRequest,
  ListAdressesRequest,
  ListAdressesResponse,
  DeleteAdresseRequest,
  Adresse,
  DeleteResponse,
} from '@proto/clients';

@Controller()
export class AdresseController {
  constructor(private readonly adresseService: AdresseService) {}

  @GrpcMethod('AdresseService', 'Create')
  async createAdresse(data: CreateAdresseRequest) {
    return this.adresseService.create({
      clientBaseId: data.client_base_id,
      ligne1: data.ligne1,
      ligne2: data.ligne2,
      codePostal: data.code_postal,
      ville: data.ville,
      pays: data.pays,
      type: data.type,
    });
  }

  @GrpcMethod('AdresseService', 'Update')
  async updateAdresse(data: UpdateAdresseRequest) {
    return this.adresseService.update({
      id: data.id,
      ligne1: data.ligne1,
      ligne2: data.ligne2,
      codePostal: data.code_postal,
      ville: data.ville,
      pays: data.pays,
      type: data.type,
    });
  }

  @GrpcMethod('AdresseService', 'Get')
  async getAdresse(data: GetAdresseRequest) {
    return this.adresseService.findById(data.id);
  }

  @GrpcMethod('AdresseService', 'ListByClient')
  async listAdressesByClient(data: ListAdressesRequest) {
    return this.adresseService.findByClient(data.client_base_id, data.pagination);
  }

  @GrpcMethod('AdresseService', 'Delete')
  async deleteAdresse(data: DeleteAdresseRequest) {
    const success = await this.adresseService.delete(data.id);
    return { success };
  }
}
