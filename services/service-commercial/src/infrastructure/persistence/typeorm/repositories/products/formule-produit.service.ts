import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FormuleProduitEntity } from '../../../../../domain/products/entities/formule-produit.entity';
import { IFormuleProduitRepository } from '../../../../../domain/products/repositories/IFormuleProduitRepository';

@Injectable()
export class FormuleProduitService implements IFormuleProduitRepository {
  private readonly logger = new Logger(FormuleProduitService.name);

  constructor(
    @InjectRepository(FormuleProduitEntity)
    private readonly repo: Repository<FormuleProduitEntity>,
  ) {}

  async findById(id: string): Promise<FormuleProduitEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByProduit(produitId: string): Promise<FormuleProduitEntity[]> {
    return this.repo.find({
      where: { produitId },
      order: { ordre: 'ASC' },
    });
  }

  async findByCode(produitId: string, code: string): Promise<FormuleProduitEntity | null> {
    return this.repo.findOne({ where: { produitId, code } });
  }

  async save(entity: FormuleProduitEntity): Promise<FormuleProduitEntity> {
    const existing = await this.findByCode(entity.produitId, entity.code);
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Formule with code '${entity.code}' already exists for this product`,
      });
    }
    return this.repo.save(entity);
  }

  async update(id: string, partial: Partial<FormuleProduitEntity>): Promise<FormuleProduitEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `FormuleProduit ${id} not found`,
      });
    }

    // Check code uniqueness if code is being changed
    if (partial.code && partial.code !== existing.code) {
      const duplicate = await this.findByCode(
        partial.produitId || existing.produitId,
        partial.code,
      );
      if (duplicate) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Formule with code '${partial.code}' already exists for this product`,
        });
      }
    }

    Object.assign(existing, partial);
    return this.repo.save(existing);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `FormuleProduit ${id} not found`,
      });
    }
  }
}
