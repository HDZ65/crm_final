import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  VisibilitePublication as ProtoVisibilitePublication,
  CreateProduitPublicationRequest,
  UpdateProduitPublicationRequest,
  ListProduitPublicationsByVersionRequest,
  ListProduitPublicationsBySocieteRequest,
  GetProduitPublicationRequest,
} from '@proto/products/products';
import { PublicationProduitEntity, VisibilitePublication } from './entities/publication-produit.entity';

const visibiliteFromProto: Record<ProtoVisibilitePublication, VisibilitePublication> = {
  [ProtoVisibilitePublication.VISIBILITE_PUBLICATION_CACHE]: VisibilitePublication.CACHE,
  [ProtoVisibilitePublication.VISIBILITE_PUBLICATION_INTERNE]: VisibilitePublication.INTERNE,
  [ProtoVisibilitePublication.VISIBILITE_PUBLICATION_PUBLIC]: VisibilitePublication.PUBLIC,
  [ProtoVisibilitePublication.VISIBILITE_PUBLICATION_UNSPECIFIED]: VisibilitePublication.INTERNE,
};

@Injectable()
export class PublicationProduitService {
  constructor(
    @InjectRepository(PublicationProduitEntity)
    private readonly repository: Repository<PublicationProduitEntity>,
  ) {}

  async create(input: CreateProduitPublicationRequest): Promise<PublicationProduitEntity> {
    const entity = this.repository.create({
      versionProduitId: input.versionProduitId,
      societeId: input.societeId,
      channels: input.channels,
      visibilite: input.visibilite ? visibiliteFromProto[input.visibilite] : VisibilitePublication.INTERNE,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
    });
    return this.repository.save(entity);
  }

  async update(input: UpdateProduitPublicationRequest): Promise<PublicationProduitEntity> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Publication ${input.id} not found` });
    }

    if (input.channels !== undefined) entity.channels = input.channels;
    if (input.visibilite !== undefined) entity.visibilite = visibiliteFromProto[input.visibilite];
    if (input.startAt !== undefined) entity.startAt = input.startAt ? new Date(input.startAt) : entity.startAt;
    if (input.endAt !== undefined) entity.endAt = input.endAt ? new Date(input.endAt) : null;

    return this.repository.save(entity);
  }

  async findByVersion(input: ListProduitPublicationsByVersionRequest): Promise<PublicationProduitEntity[]> {
    return this.repository.find({
      where: { versionProduitId: input.versionProduitId },
      order: { startAt: 'DESC' },
    });
  }

  async findBySociete(input: ListProduitPublicationsBySocieteRequest): Promise<PublicationProduitEntity[]> {
    return this.repository.find({
      where: { societeId: input.societeId },
      order: { startAt: 'DESC' },
    });
  }

  async findById(input: GetProduitPublicationRequest): Promise<PublicationProduitEntity> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Publication ${input.id} not found`,
      });
    }
    return entity;
  }
}
