import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvitationCompte } from './entities/invitation-compte.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationCompteService {
  constructor(
    @InjectRepository(InvitationCompte)
    private readonly repository: Repository<InvitationCompte>,
  ) {}

  async create(data: {
    organisationId: string;
    emailInvite: string;
    roleId: string;
    expireAt?: Date;
  }): Promise<InvitationCompte> {
    const token = randomBytes(32).toString('hex');
    const expireAt = data.expireAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    const entity = this.repository.create({
      ...data,
      token,
      expireAt,
      etat: 'pending',
    });
    return this.repository.save(entity);
  }

  async update(data: { id: string; etat?: string }): Promise<InvitationCompte> {
    const entity = await this.findById(data.id);
    if (data.etat !== undefined) entity.etat = data.etat;
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<InvitationCompte> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`InvitationCompte with ID ${id} not found`);
    }
    return entity;
  }

  async findByToken(token: string): Promise<InvitationCompte> {
    const entity = await this.repository.findOne({ where: { token } });
    if (!entity) {
      throw new NotFoundException(`InvitationCompte with token not found`);
    }
    return entity;
  }

  async findByOrganisation(
    organisationId: string,
    pagination?: { page?: number; limit?: number },
  ) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: { organisationId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      invitations: data,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findPendingByEmail(email: string): Promise<InvitationCompte[]> {
    return this.repository.find({
      where: { emailInvite: email, etat: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  async accept(id: string): Promise<InvitationCompte> {
    const entity = await this.findById(id);
    entity.etat = 'accepted';
    return this.repository.save(entity);
  }

  async reject(id: string): Promise<InvitationCompte> {
    const entity = await this.findById(id);
    entity.etat = 'rejected';
    return this.repository.save(entity);
  }

  async expire(id: string): Promise<InvitationCompte> {
    const entity = await this.findById(id);
    entity.etat = 'expired';
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
