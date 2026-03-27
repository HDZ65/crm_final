import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import type { CalculatePriceRequest, CalculatePriceResponse } from '@proto/products';
import { TarificationService } from '../../../domain/products/services/tarification.engine';

@Controller()
export class CatalogController {
  constructor(private readonly tarificationService: TarificationService) {}

  @GrpcMethod('CatalogService', 'CalculatePrice')
  async calculatePrice(data: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    if (!data.produitId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'produitId est requis',
      });
    }

    if (data.quantite <= 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'quantite doit etre superieure a 0',
      });
    }

    try {
      const prix = await this.tarificationService.calculate(data.produitId, data.quantite, {
        grilleTarifaireId: data.grilleTarifaireId || undefined,
        remiseAdditionnelle: data.remiseAdditionnelle,
      });

      return {
        prixUnitaire: prix.prixUnitaire,
        prixApresRemise: prix.prixApresRemise,
        prixTotalHt: prix.prixTotalHt,
        tva: prix.tva,
        prixTotalTtc: prix.prixTotalTtc,
        promotionAppliquee: prix.promotionAppliquee,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Erreur de calcul tarifaire';
      const code = message.includes('introuvable') ? status.NOT_FOUND : status.INTERNAL;

      throw new RpcException({
        code,
        message,
      });
    }
  }
}
