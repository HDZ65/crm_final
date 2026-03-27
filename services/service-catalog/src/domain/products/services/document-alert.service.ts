import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { DocumentAlertEntity, DocumentAlertSeverity, DocumentAlertType } from '../entities/document-alert.entity';
import { DocumentProduitEntity } from '../entities/document-produit.entity';
import { PublicationProduitEntity } from '../entities/publication-produit.entity';

@Injectable()
export class DocumentAlertService {
  private readonly logger = new Logger(DocumentAlertService.name);

  constructor(
    @InjectRepository(DocumentAlertEntity)
    private readonly alertRepo: Repository<DocumentAlertEntity>,
    @InjectRepository(DocumentProduitEntity)
    private readonly documentRepo: Repository<DocumentProduitEntity>,
    @InjectRepository(PublicationProduitEntity)
    private readonly publicationRepo: Repository<PublicationProduitEntity>,
  ) {}

  async checkExpiringDocuments(): Promise<void> {
    try {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const candidateDocs = await this.documentRepo.find({
        where: [
          { mandatory: true, validTo: LessThan(in30Days) },
          { mandatory: true, publishedAt: IsNull() },
        ],
      });

      const activePublications = await this.publicationRepo.find({
        where: [{ endAt: IsNull() }, { endAt: MoreThan(now) }],
      });

      const publishedVersionIds = new Set(activePublications.map((p) => p.versionProduitId));

      const publishedDocs = candidateDocs.filter((doc) => publishedVersionIds.has(doc.versionProduitId));

      for (const doc of publishedDocs) {
        const productId = doc.produitId;
        if (!productId) {
          continue;
        }

        let alertType: DocumentAlertType;
        let severity: DocumentAlertSeverity;
        let message: string;

        if (!doc.publishedAt) {
          alertType = DocumentAlertType.MISSING;
          severity = DocumentAlertSeverity.CRITICAL;
          message = `Document obligatoire "${doc.title}" (${doc.type}) non publié pour le produit ${productId}`;
        } else if (doc.validTo && doc.validTo < now) {
          alertType = DocumentAlertType.EXPIRED;
          severity = DocumentAlertSeverity.CRITICAL;
          message = `Document obligatoire "${doc.title}" (${doc.type}) expiré depuis le ${doc.validTo.toISOString()} pour le produit ${productId}`;
        } else {
          alertType = DocumentAlertType.EXPIRING_SOON;
          severity = DocumentAlertSeverity.WARNING;
          message = `Document obligatoire "${doc.title}" (${doc.type}) expire le ${doc.validTo?.toISOString()} pour le produit ${productId}`;
        }

        const existing = await this.alertRepo.findOne({
          where: {
            productId,
            productDocumentId: doc.id,
            alertType,
            acknowledged: false,
          },
        });

        if (existing) {
          continue;
        }

        const alert = this.alertRepo.create({
          productId,
          productDocumentId: doc.id,
          alertType,
          severity,
          message,
          acknowledged: false,
          acknowledgedBy: null,
          acknowledgedAt: null,
        });

        await this.alertRepo.save(alert);
      }

      this.logger.log(`checkExpiringDocuments: processed ${publishedDocs.length} candidate document(s)`);
    } catch (error) {
      this.logger.error('checkExpiringDocuments failed', error);
    }
  }

  async listAlerts(filters: {
    status?: string;
    severity?: string;
    productId?: string;
  }): Promise<DocumentAlertEntity[]> {
    try {
      const query = this.alertRepo.createQueryBuilder('alert').orderBy('alert.createdAt', 'DESC');

      if (filters.productId) {
        query.andWhere('alert.productId = :productId', { productId: filters.productId });
      }

      if (filters.severity) {
        query.andWhere('alert.severity = :severity', { severity: filters.severity });
      }

      if (filters.status === 'acknowledged') {
        query.andWhere('alert.acknowledged = true');
      } else if (filters.status === 'pending') {
        query.andWhere('alert.acknowledged = false');
      }

      return query.getMany();
    } catch (error) {
      this.logger.error('listAlerts failed', error);
      return [];
    }
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<DocumentAlertEntity> {
    const alert = await this.alertRepo.findOne({ where: { id } });

    if (!alert) {
      throw new Error(`DocumentAlert not found: ${id}`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    return this.alertRepo.save(alert);
  }

  async getAlertCountForProduct(productId: string): Promise<number> {
    try {
      return this.alertRepo.count({
        where: { productId, acknowledged: false },
      });
    } catch (error) {
      this.logger.error(`getAlertCountForProduct failed for ${productId}`, error);
      return 0;
    }
  }
}
