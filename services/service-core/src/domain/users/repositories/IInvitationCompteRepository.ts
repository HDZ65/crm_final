import { InvitationCompteEntity } from '../entities/invitation-compte.entity';

export interface IInvitationCompteRepository {
  findById(id: string): Promise<InvitationCompteEntity | null>;
  findAll(): Promise<InvitationCompteEntity[]>;
  save(entity: InvitationCompteEntity): Promise<InvitationCompteEntity>;
  delete(id: string): Promise<void>;
  findByToken(token: string): Promise<InvitationCompteEntity | null>;
  findByOrganisationId(organisationId: string): Promise<InvitationCompteEntity[]>;
}
