import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { GetEvolutionCaRequest, EvolutionCaResponse } from '@proto/dashboard';

@Controller()
export class EvolutionCaController {
  @GrpcMethod('EvolutionCaService', 'GetEvolutionCa')
  async getEvolutionCa(_: GetEvolutionCaRequest): Promise<EvolutionCaResponse> {
    return {
      periode_debut: '',
      periode_fin: '',
      donnees: [],
    };
  }
}
