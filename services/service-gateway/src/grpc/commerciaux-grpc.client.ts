import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface ApporteurServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByUtilisateur(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  Activer(data: Record<string, unknown>): Observable<unknown>;
  Desactiver(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface BaremeCommissionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  ListActifs(data: Record<string, unknown>): Observable<unknown>;
  GetWithPaliers(data: Record<string, unknown>): Observable<unknown>;
  Activer(data: Record<string, unknown>): Observable<unknown>;
  Desactiver(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface PalierCommissionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByBareme(data: Record<string, unknown>): Observable<unknown>;
  Activer(data: Record<string, unknown>): Observable<unknown>;
  Desactiver(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface ModeleDistributionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class CommerciauxGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(CommerciauxGrpcClient.name);
  private apporteurService: ApporteurServiceClient;
  private baremeCommissionService: BaremeCommissionServiceClient;
  private palierCommissionService: PalierCommissionServiceClient;
  private modeleDistributionService: ModeleDistributionServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.apporteurService =
      this.client.getService<ApporteurServiceClient>('ApporteurService');
    this.baremeCommissionService =
      this.client.getService<BaremeCommissionServiceClient>('BaremeCommissionService');
    this.palierCommissionService =
      this.client.getService<PalierCommissionServiceClient>('PalierCommissionService');
    this.modeleDistributionService =
      this.client.getService<ModeleDistributionServiceClient>('ModeleDistributionService');
  }

  createApporteur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.apporteurService.Create(data), this.logger, 'ApporteurService', 'Create');
  }

  updateApporteur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.apporteurService.Update(data), this.logger, 'ApporteurService', 'Update');
  }

  getApporteur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.apporteurService.Get(data), this.logger, 'ApporteurService', 'Get');
  }

  getApporteurByUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.apporteurService.GetByUtilisateur(data),
      this.logger,
      'ApporteurService',
      'GetByUtilisateur',
    );
  }

  listApporteurs(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.apporteurService.List(data), this.logger, 'ApporteurService', 'List');
  }

  listApporteursByOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.apporteurService.ListByOrganisation(data),
      this.logger,
      'ApporteurService',
      'ListByOrganisation',
    );
  }

  activerApporteur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.apporteurService.Activer(data), this.logger, 'ApporteurService', 'Activer');
  }

  desactiverApporteur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.apporteurService.Desactiver(data),
      this.logger,
      'ApporteurService',
      'Desactiver',
    );
  }

  deleteApporteur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.apporteurService.Delete(data), this.logger, 'ApporteurService', 'Delete');
  }

  createBaremeCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.Create(data),
      this.logger,
      'BaremeCommissionService',
      'Create',
    );
  }

  updateBaremeCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.Update(data),
      this.logger,
      'BaremeCommissionService',
      'Update',
    );
  }

  getBaremeCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.baremeCommissionService.Get(data), this.logger, 'BaremeCommissionService', 'Get');
  }

  getBaremeCommissionByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.GetByCode(data),
      this.logger,
      'BaremeCommissionService',
      'GetByCode',
    );
  }

  listBaremeCommissions(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.List(data),
      this.logger,
      'BaremeCommissionService',
      'List',
    );
  }

  listBaremeCommissionsByOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.ListByOrganisation(data),
      this.logger,
      'BaremeCommissionService',
      'ListByOrganisation',
    );
  }

  listBaremeCommissionsActifs(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.ListActifs(data),
      this.logger,
      'BaremeCommissionService',
      'ListActifs',
    );
  }

  getBaremeCommissionWithPaliers(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.GetWithPaliers(data),
      this.logger,
      'BaremeCommissionService',
      'GetWithPaliers',
    );
  }

  activerBaremeCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.Activer(data),
      this.logger,
      'BaremeCommissionService',
      'Activer',
    );
  }

  desactiverBaremeCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.Desactiver(data),
      this.logger,
      'BaremeCommissionService',
      'Desactiver',
    );
  }

  deleteBaremeCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.baremeCommissionService.Delete(data),
      this.logger,
      'BaremeCommissionService',
      'Delete',
    );
  }

  createPalierCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.palierCommissionService.Create(data),
      this.logger,
      'PalierCommissionService',
      'Create',
    );
  }

  updatePalierCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.palierCommissionService.Update(data),
      this.logger,
      'PalierCommissionService',
      'Update',
    );
  }

  getPalierCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.palierCommissionService.Get(data), this.logger, 'PalierCommissionService', 'Get');
  }

  listPaliersByBareme(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.palierCommissionService.ListByBareme(data),
      this.logger,
      'PalierCommissionService',
      'ListByBareme',
    );
  }

  activerPalierCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.palierCommissionService.Activer(data),
      this.logger,
      'PalierCommissionService',
      'Activer',
    );
  }

  desactiverPalierCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.palierCommissionService.Desactiver(data),
      this.logger,
      'PalierCommissionService',
      'Desactiver',
    );
  }

  deletePalierCommission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.palierCommissionService.Delete(data),
      this.logger,
      'PalierCommissionService',
      'Delete',
    );
  }

  createModeleDistribution(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.modeleDistributionService.Create(data),
      this.logger,
      'ModeleDistributionService',
      'Create',
    );
  }

  updateModeleDistribution(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.modeleDistributionService.Update(data),
      this.logger,
      'ModeleDistributionService',
      'Update',
    );
  }

  getModeleDistribution(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.modeleDistributionService.Get(data),
      this.logger,
      'ModeleDistributionService',
      'Get',
    );
  }

  getModeleDistributionByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.modeleDistributionService.GetByCode(data),
      this.logger,
      'ModeleDistributionService',
      'GetByCode',
    );
  }

  listModelesDistribution(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.modeleDistributionService.List(data),
      this.logger,
      'ModeleDistributionService',
      'List',
    );
  }

  deleteModeleDistribution(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.modeleDistributionService.Delete(data),
      this.logger,
      'ModeleDistributionService',
      'Delete',
    );
  }
}
