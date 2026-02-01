import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionEngineService } from './commission-engine.service';
import { TypeReprise } from '../reprise/entities/reprise-commission.entity';

import type {
  CalculerCommissionRequest,
  CalculerCommissionResponse,
  GenererBordereauRequest,
  GenererBordereauResponse,
  DeclencherRepriseRequest,
  RepriseResponse,
} from '@crm/proto/commission';

const grpcToTypeReprise = (n: number): TypeReprise =>
  [TypeReprise.RESILIATION, TypeReprise.RESILIATION, TypeReprise.IMPAYE, TypeReprise.ANNULATION, TypeReprise.REGULARISATION][n] || TypeReprise.RESILIATION;

@Controller()
export class EngineController {
  constructor(private readonly engine: CommissionEngineService) {}

  @GrpcMethod('CommissionService', 'CalculerCommission')
  async calculer(req: CalculerCommissionRequest): Promise<CalculerCommissionResponse> {
    try {
      const result = await this.engine.calculerCommission({
        organisationId: req.organisationId,
        apporteurId: req.apporteurId,
        contratId: req.contratId,
        produitId: req.produitId,
        typeProduit: req.typeProduit,
        profilRemuneration: req.profilRemuneration,
        societeId: req.societeId,
        canalVente: req.canalVente,
        montantBase: parseFloat(req.montantBase),
        periode: req.periode,
      });

      return {
        commission: result.commission as unknown as CalculerCommissionResponse['commission'],
        baremeApplique: result.baremeApplique as unknown as CalculerCommissionResponse['baremeApplique'],
        primes: result.primes.map(p => ({
          palierId: p.palierId,
          palierNom: p.palierNom,
          montant: String(p.montant),
          type: p.type,
        })),
        montantTotal: String(result.montantTotal),
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GenererBordereau')
  async genererBordereau(req: GenererBordereauRequest): Promise<GenererBordereauResponse> {
    try {
      const result = await this.engine.genererBordereau(
        req.organisationId,
        req.apporteurId,
        req.periode,
        req.creePar,
      );

      return {
        bordereau: result.bordereau as unknown as GenererBordereauResponse['bordereau'],
        summary: {
          nombreCommissions: result.summary.nombreCommissions,
          nombreReprises: result.summary.nombreReprises,
          nombrePrimes: result.summary.nombrePrimes,
          totalBrut: String(result.summary.totalBrut),
          totalReprises: String(result.summary.totalReprises),
          totalNet: String(result.summary.totalNet),
        },
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeclencherReprise')
  async declencherReprise(req: DeclencherRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.engine.declencherReprise(
        req.commissionId,
        grpcToTypeReprise(req.typeReprise),
        new Date(req.dateEvenement),
        req.motif,
      );
      return { reprise: reprise as unknown as RepriseResponse['reprise'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
