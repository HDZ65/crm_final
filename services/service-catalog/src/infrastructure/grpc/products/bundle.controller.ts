import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  type BundleCalculatePriceRequest,
  type BundleCalculatePriceResponse,
  type RecalculateClientRequest,
  type RecalculateClientResponse,
  TypeRemise,
} from '@proto/bundle';
import {
  BundleEngineService,
  BundleServiceCode,
  type RecalculateOnServiceChangeInput,
} from '../../persistence/typeorm/repositories/products/bundle-engine.service';

@Controller()
export class BundleController {
  constructor(private readonly bundleEngineService: BundleEngineService) {}

  @GrpcMethod('BundleSvc', 'CalculatePrice')
  async calculatePrice(data: BundleCalculatePriceRequest): Promise<BundleCalculatePriceResponse> {
    const services = this.extractServices(data.itemOverrides?.map((item) => item.produitId));
    if (services.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Aucun service a calculer. Utilisez itemOverrides[].produitId.',
      });
    }

    const pricing = await this.bundleEngineService.calculatePrice(
      data.clientId,
      services,
      data.bundleId || undefined,
    );

    const items = pricing.items.map((item) => ({
      produitId: item.service,
      nomProduit: this.displayName(item.service),
      quantite: 1,
      prixUnitaire: item.basePrice,
      remiseItem: item.discount,
      prixLigneHt: item.finalPrice,
    }));

    return {
      bundleId: data.bundleId || pricing.configurationId,
      items,
      sousTotalHt: pricing.sousTotalHt,
      remiseBundle: pricing.remiseBundle,
      totalHt: pricing.totalHt,
      tva: 0,
      totalTtc: pricing.totalHt,
      typeRemiseAppliquee:
        pricing.remiseBundle > 0 ? TypeRemise.MONTANT_FIXE : TypeRemise.UNSPECIFIED,
      valeurRemiseAppliquee: pricing.remiseBundle,
    };
  }

  @GrpcMethod('BundleSvc', 'RecalculateClient')
  async recalculateClient(data: RecalculateClientRequest): Promise<RecalculateClientResponse> {
    const recalculatePayload: RecalculateOnServiceChangeInput = {
      clientId: data.clientId,
      keycloakGroupId: data.organisationId,
      services: [BundleServiceCode.CONCIERGERIE, BundleServiceCode.JUSTI_PLUS, BundleServiceCode.WINCASH],
      serviceChanged: BundleServiceCode.JUSTI_PLUS,
      action: 'added',
    };

    const pricing = await this.bundleEngineService.recalculateOnServiceChange(recalculatePayload);

    return {
      clientId: data.clientId,
      bundlesEvalues: 1,
      eligibilites: [
        {
          bundleId: pricing.configurationId,
          bundleNom: 'Conciergerie + Justi+ + Wincash',
          eligible: true,
          raison: '',
          economieEstimee: pricing.remiseBundle,
        },
      ],
    };
  }

  private extractServices(values: (string | undefined)[]): string[] {
    return values.filter((value): value is string => Boolean(value));
  }

  private displayName(service: BundleServiceCode): string {
    if (service === BundleServiceCode.CONCIERGERIE) {
      return 'Conciergerie';
    }

    if (service === BundleServiceCode.JUSTI_PLUS) {
      return 'Justi+';
    }

    if (service === BundleServiceCode.WINCASH) {
      return 'Wincash';
    }

    return service;
  }
}
