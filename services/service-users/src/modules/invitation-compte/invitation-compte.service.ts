import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { randomUUID } from 'crypto';
import { InvitationCompteEntity } from './entities/invitation-compte.entity';

@Injectable()
export class InvitationCompteService {
  private readonly logger = new Logger(InvitationCompteService.name);

  constructor(
    @InjectRepository(InvitationCompteEntity)
    private readonly repository: Repository<InvitationCompteEntity>,
  ) {}

  async create(input: {
    organisationId: string;
    emailInvite: string;
    roleId: string;
    expireDays?: number;
  }): Promise<InvitationCompteEntity> {
    const existing = await this.repository.findOne({
      where: { organisationId: input.organisationId, emailInvite: input.emailInvite, etat: 'pending' },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `A pending invitation already exists for this email`,
      });
    }

    const expireDays = input.expireDays ?? 7;
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expireDays);

    const entity = this.repository.create({
      organisationId: input.organisationId,
      emailInvite: input.emailInvite,
      roleId: input.roleId,
      token: randomUUID(),
      expireAt,
      etat: 'pending',
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; roleId?: string; etat?: string }): Promise<InvitationCompteEntity> {
    const entity = await this.findById(input.id);

    if (input.roleId !== undefined) entity.roleId = input.roleId;
    if (input.etat !== undefined) entity.etat = input.etat;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<InvitationCompteEntity> {
    const entity = await this.repository.findOne({ where: { id }, relations: ['role'] });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Invitation ${id} not found` });
    }
    return entity;
  }

  async findByToken(token: string): Promise<InvitationCompteEntity> {
    const entity = await this.repository.findOne({ where: { token }, relations: ['role'] });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Invitation with token not found` });
    }
    return entity;
  }

  async findByOrganisation(
    organisationId: string,
    etat?: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    invitations: InvitationCompteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const where: FindOptionsWhere<InvitationCompteEntity> = { organisationId };
    if (etat) where.etat = etat;

    const [invitations, total] = await this.repository.findAndCount({
      where,
      relations: ['role'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { invitations, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async markAsAccepted(id: string): Promise<InvitationCompteEntity> {
    const entity = await this.findById(id);
    entity.etat = 'accepted';
    return this.repository.save(entity);
  }

  async isTokenValid(token: string): Promise<{ valid: boolean; invitation?: InvitationCompteEntity; reason?: string }> {
    const invitation = await this.repository.findOne({ where: { token }, relations: ['role'] });

    if (!invitation) {
      return { valid: false, reason: 'Invitation not found' };
    }

    if (invitation.etat !== 'pending') {
      return { valid: false, invitation, reason: `Invitation already ${invitation.etat}` };
    }

    if (new Date() > invitation.expireAt) {
      return { valid: false, invitation, reason: 'Invitation expired' };
    }

    return { valid: true, invitation };
  }
}
