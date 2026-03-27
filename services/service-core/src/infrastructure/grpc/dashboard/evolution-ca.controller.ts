import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { EvolutionCaResponse, GetEvolutionCaRequest } from '@proto/dashboard';

@Controller()
export class EvolutionCaController {
  @GrpcMethod('EvolutionCaService', 'GetEvolutionCa')
  async getEvolutionCa(_: GetEvolutionCaRequest): Promise<EvolutionCaResponse> {
    return {
      periodeDebut: '',
      periodeFin: '',
      donnees: [],
    };
  }
}
