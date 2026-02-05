import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  CreateProduitPublicationRequest,
  UpdateProduitPublicationRequest,
  ListProduitPublicationsByVersionRequest,
  ListProduitPublicationsBySocieteRequest,
  GetProduitPublicationRequest,
} from '@crm/proto/products';
import { PublicationProduitEntity, VisibilitePublication } from './entities/publication-produit.entity';

// Proto enum values (matching proto definitions to avoid ESM import issues)
const ProtoVisibilitePublication = {
  VISIBILITE_PUBLICATION_UNSPECIFIED: 0,
  VISIBILITE_PUBLICATION_CACHE: 1,
  VISIBILITE_PUBLICATION_INTERNE: 2,
  VISIBILITE_PUBLICATION_PUBLIC: 3,
} as const;

type ProtoVisibilitePublicationType = (typeof ProtoVisibilitePublication)[keyof typeof ProtoVisibilitePublication];

const visibiliteFromProto: Record<ProtoVisibilitePublicationType, VisibilitePublication> = {
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
      versionProduitId: input.version_produit_id,
      societeId: input.societe_id,
      channels: input.channels,
      visibilite: input.visibilite ? visibiliteFromProto[input.visibilite] : VisibilitePublication.INTERNE,
      startAt: new Date(input.start_at),
      endAt: input.end_at ? new Date(input.end_at) : null,
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
    if (input.start_at !== undefined) entity.startAt = input.start_at ? new Date(input.start_at) : entity.startAt;
    if (input.end_at !== undefined) entity.endAt = input.end_at ? new Date(input.end_at) : null;

    return this.repository.save(entity);
  }

  async findByVersion(input: ListProduitPublicationsByVersionRequest): Promise<PublicationProduitEntity[]> {
    return this.repository.find({
      where: { versionProduitId: input.version_produit_id },
      order: { startAt: 'DESC' },
    });
  }

  async findBySociete(input: ListProduitPublicationsBySocieteRequest): Promise<PublicationProduitEntity[]> {
    return this.repository.find({
      where: { societeId: input.societe_id },
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
