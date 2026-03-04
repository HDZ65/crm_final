import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

interface OrganisationServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  CreateWithOwner(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface SocieteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface StatutPartenaireServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface PartenaireMarqueBlancheServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface ThemeMarqueServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface RolePartenaireServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface MembrePartenaireServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByPartenaire(data: Record<string, unknown>): Observable<unknown>;
  ListByUtilisateur(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

interface InvitationCompteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByToken(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  ListPendingByEmail(data: Record<string, unknown>): Observable<unknown>;
  Accept(data: Record<string, unknown>): Observable<unknown>;
  Reject(data: Record<string, unknown>): Observable<unknown>;
  Expire(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class OrganisationsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(OrganisationsGrpcClient.name);
  private organisationService: OrganisationServiceClient;
  private societeService: SocieteServiceClient;
  private statutPartenaireService: StatutPartenaireServiceClient;
  private partenaireMarqueBlancheService: PartenaireMarqueBlancheServiceClient;
  private themeMarqueService: ThemeMarqueServiceClient;
  private rolePartenaireService: RolePartenaireServiceClient;
  private membrePartenaireService: MembrePartenaireServiceClient;
  private invitationCompteService: InvitationCompteServiceClient;

  constructor(@Inject('CORE_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.organisationService =
      this.client.getService<OrganisationServiceClient>('OrganisationService');
    this.societeService = this.client.getService<SocieteServiceClient>('SocieteService');
    this.statutPartenaireService =
      this.client.getService<StatutPartenaireServiceClient>('StatutPartenaireService');
    this.partenaireMarqueBlancheService = this.client.getService<PartenaireMarqueBlancheServiceClient>(
      'PartenaireMarqueBlancheService',
    );
    this.themeMarqueService =
      this.client.getService<ThemeMarqueServiceClient>('ThemeMarqueService');
    this.rolePartenaireService =
      this.client.getService<RolePartenaireServiceClient>('RolePartenaireService');
    this.membrePartenaireService =
      this.client.getService<MembrePartenaireServiceClient>('MembrePartenaireService');
    this.invitationCompteService =
      this.client.getService<InvitationCompteServiceClient>('InvitationCompteService');
  }

  organisationCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.organisationService.Create(data),
      this.logger,
      'OrganisationService',
      'Create',
    );
  }

  organisationCreateWithOwner(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.organisationService.CreateWithOwner(data),
      this.logger,
      'OrganisationService',
      'CreateWithOwner',
    );
  }

  organisationUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.organisationService.Update(data),
      this.logger,
      'OrganisationService',
      'Update',
    );
  }

  organisationGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.organisationService.Get(data),
      this.logger,
      'OrganisationService',
      'Get',
    );
  }

  organisationList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.organisationService.List(data),
      this.logger,
      'OrganisationService',
      'List',
    );
  }

  organisationDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.organisationService.Delete(data),
      this.logger,
      'OrganisationService',
      'Delete',
    );
  }

  societeCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.societeService.Create(data),
      this.logger,
      'SocieteService',
      'Create',
    );
  }

  societeUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.societeService.Update(data),
      this.logger,
      'SocieteService',
      'Update',
    );
  }

  societeGet(data: Record<string, unknown>) {
    return wrapGrpcCall(this.societeService.Get(data), this.logger, 'SocieteService', 'Get');
  }

  societeListByOrganisation(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.societeService.ListByOrganisation(data),
      this.logger,
      'SocieteService',
      'ListByOrganisation',
    );
  }

  societeList(data: Record<string, unknown>) {
    return wrapGrpcCall(this.societeService.List(data), this.logger, 'SocieteService', 'List');
  }

  societeDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.societeService.Delete(data),
      this.logger,
      'SocieteService',
      'Delete',
    );
  }

  statutPartenaireCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.statutPartenaireService.Create(data),
      this.logger,
      'StatutPartenaireService',
      'Create',
    );
  }

  statutPartenaireUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.statutPartenaireService.Update(data),
      this.logger,
      'StatutPartenaireService',
      'Update',
    );
  }

  statutPartenaireGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.statutPartenaireService.Get(data),
      this.logger,
      'StatutPartenaireService',
      'Get',
    );
  }

  statutPartenaireGetByCode(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.statutPartenaireService.GetByCode(data),
      this.logger,
      'StatutPartenaireService',
      'GetByCode',
    );
  }

  statutPartenaireList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.statutPartenaireService.List(data),
      this.logger,
      'StatutPartenaireService',
      'List',
    );
  }

  statutPartenaireDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.statutPartenaireService.Delete(data),
      this.logger,
      'StatutPartenaireService',
      'Delete',
    );
  }

  partenaireMarqueBlancheCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.partenaireMarqueBlancheService.Create(data),
      this.logger,
      'PartenaireMarqueBlancheService',
      'Create',
    );
  }

  partenaireMarqueBlancheUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.partenaireMarqueBlancheService.Update(data),
      this.logger,
      'PartenaireMarqueBlancheService',
      'Update',
    );
  }

  partenaireMarqueBlancheGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.partenaireMarqueBlancheService.Get(data),
      this.logger,
      'PartenaireMarqueBlancheService',
      'Get',
    );
  }

  partenaireMarqueBlancheList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.partenaireMarqueBlancheService.List(data),
      this.logger,
      'PartenaireMarqueBlancheService',
      'List',
    );
  }

  partenaireMarqueBlancheDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.partenaireMarqueBlancheService.Delete(data),
      this.logger,
      'PartenaireMarqueBlancheService',
      'Delete',
    );
  }

  themeMarqueCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.themeMarqueService.Create(data),
      this.logger,
      'ThemeMarqueService',
      'Create',
    );
  }

  themeMarqueUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.themeMarqueService.Update(data),
      this.logger,
      'ThemeMarqueService',
      'Update',
    );
  }

  themeMarqueGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.themeMarqueService.Get(data),
      this.logger,
      'ThemeMarqueService',
      'Get',
    );
  }

  themeMarqueList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.themeMarqueService.List(data),
      this.logger,
      'ThemeMarqueService',
      'List',
    );
  }

  themeMarqueDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.themeMarqueService.Delete(data),
      this.logger,
      'ThemeMarqueService',
      'Delete',
    );
  }

  rolePartenaireCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.rolePartenaireService.Create(data),
      this.logger,
      'RolePartenaireService',
      'Create',
    );
  }

  rolePartenaireUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.rolePartenaireService.Update(data),
      this.logger,
      'RolePartenaireService',
      'Update',
    );
  }

  rolePartenaireGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.rolePartenaireService.Get(data),
      this.logger,
      'RolePartenaireService',
      'Get',
    );
  }

  rolePartenaireGetByCode(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.rolePartenaireService.GetByCode(data),
      this.logger,
      'RolePartenaireService',
      'GetByCode',
    );
  }

  rolePartenaireList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.rolePartenaireService.List(data),
      this.logger,
      'RolePartenaireService',
      'List',
    );
  }

  rolePartenaireDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.rolePartenaireService.Delete(data),
      this.logger,
      'RolePartenaireService',
      'Delete',
    );
  }

  membrePartenaireCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.membrePartenaireService.Create(data),
      this.logger,
      'MembrePartenaireService',
      'Create',
    );
  }

  membrePartenaireUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.membrePartenaireService.Update(data),
      this.logger,
      'MembrePartenaireService',
      'Update',
    );
  }

  membrePartenaireGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.membrePartenaireService.Get(data),
      this.logger,
      'MembrePartenaireService',
      'Get',
    );
  }

  membrePartenaireListByPartenaire(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.membrePartenaireService.ListByPartenaire(data),
      this.logger,
      'MembrePartenaireService',
      'ListByPartenaire',
    );
  }

  membrePartenaireListByUtilisateur(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.membrePartenaireService.ListByUtilisateur(data),
      this.logger,
      'MembrePartenaireService',
      'ListByUtilisateur',
    );
  }

  membrePartenaireDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.membrePartenaireService.Delete(data),
      this.logger,
      'MembrePartenaireService',
      'Delete',
    );
  }

  invitationCompteCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Create(data),
      this.logger,
      'InvitationCompteService',
      'Create',
    );
  }

  invitationCompteUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Update(data),
      this.logger,
      'InvitationCompteService',
      'Update',
    );
  }

  invitationCompteGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Get(data),
      this.logger,
      'InvitationCompteService',
      'Get',
    );
  }

  invitationCompteGetByToken(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.GetByToken(data),
      this.logger,
      'InvitationCompteService',
      'GetByToken',
    );
  }

  invitationCompteListByOrganisation(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.ListByOrganisation(data),
      this.logger,
      'InvitationCompteService',
      'ListByOrganisation',
    );
  }

  invitationCompteListPendingByEmail(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.ListPendingByEmail(data),
      this.logger,
      'InvitationCompteService',
      'ListPendingByEmail',
    );
  }

  invitationCompteAccept(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Accept(data),
      this.logger,
      'InvitationCompteService',
      'Accept',
    );
  }

  invitationCompteReject(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Reject(data),
      this.logger,
      'InvitationCompteService',
      'Reject',
    );
  }

  invitationCompteExpire(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Expire(data),
      this.logger,
      'InvitationCompteService',
      'Expire',
    );
  }

  invitationCompteDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.invitationCompteService.Delete(data),
      this.logger,
      'InvitationCompteService',
      'Delete',
    );
  }
}
