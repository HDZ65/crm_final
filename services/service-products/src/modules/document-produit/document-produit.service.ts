import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  CreateProduitDocumentRequest,
  UpdateProduitDocumentRequest,
  ListProduitDocumentsRequest,
  GetProduitDocumentRequest,
} from '@crm/proto/products';
import { DocumentProduitEntity, TypeDocumentProduit } from './entities/document-produit.entity';

// Proto enum values (matching proto definitions to avoid ESM import issues)
const ProtoTypeDocumentProduit = {
  TYPE_DOCUMENT_PRODUIT_UNSPECIFIED: 0,
  TYPE_DOCUMENT_PRODUIT_DIPA: 1,
  TYPE_DOCUMENT_PRODUIT_CG: 2,
  TYPE_DOCUMENT_PRODUIT_CP: 3,
  TYPE_DOCUMENT_PRODUIT_TARIF: 4,
  TYPE_DOCUMENT_PRODUIT_SCRIPT: 5,
  TYPE_DOCUMENT_PRODUIT_MEDIA: 6,
} as const;

type ProtoTypeDocumentProduitType = (typeof ProtoTypeDocumentProduit)[keyof typeof ProtoTypeDocumentProduit];

const typeDocumentFromProto: Record<ProtoTypeDocumentProduitType, TypeDocumentProduit> = {
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_DIPA]: TypeDocumentProduit.DIPA,
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_CG]: TypeDocumentProduit.CG,
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_CP]: TypeDocumentProduit.CP,
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_TARIF]: TypeDocumentProduit.TARIF,
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_SCRIPT]: TypeDocumentProduit.SCRIPT,
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_MEDIA]: TypeDocumentProduit.MEDIA,
  [ProtoTypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_UNSPECIFIED]: TypeDocumentProduit.DIPA,
};

@Injectable()
export class DocumentProduitService {
  constructor(
    @InjectRepository(DocumentProduitEntity)
    private readonly repository: Repository<DocumentProduitEntity>,
  ) {}

  async create(input: CreateProduitDocumentRequest): Promise<DocumentProduitEntity> {
    const entity = this.repository.create({
      versionProduitId: input.versionProduitId,
      type: typeDocumentFromProto[input.type],
      title: input.title,
      fileUrl: input.fileUrl,
      fileHash: input.fileHash,
      mandatory: input.mandatory ?? false,
      publishedAt: null,
    });
    return this.repository.save(entity);
  }

  async update(input: UpdateProduitDocumentRequest): Promise<DocumentProduitEntity> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Document ${input.id} not found` });
    }

    if (input.title !== undefined) entity.title = input.title;
    if (input.fileUrl !== undefined) entity.fileUrl = input.fileUrl;
    if (input.fileHash !== undefined) entity.fileHash = input.fileHash;
    if (input.mandatory !== undefined) entity.mandatory = input.mandatory;
    if (input.publishedAt !== undefined) {
      entity.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    }

    return this.repository.save(entity);
  }

  async findByVersion(input: ListProduitDocumentsRequest): Promise<DocumentProduitEntity[]> {
    return this.repository.find({
      where: { versionProduitId: input.versionProduitId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(input: GetProduitDocumentRequest): Promise<DocumentProduitEntity> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Document ${input.id} not found`,
      });
    }
    return entity;
  }
}
