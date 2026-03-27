/* eslint-disable @typescript-eslint/no-explicit-any */

import { DocumentAlertSeverity, DocumentAlertType } from '../../entities/document-alert.entity';
import { DocumentAlertService } from '../document-alert.service';

type MockRepo<_T> = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function makeAlertRepo(): MockRepo<unknown> {
  return {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((data: unknown) => ({ ...(data as object), id: 'alert-1', createdAt: new Date() })),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    count: jest.fn(() => Promise.resolve(0)),
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn(function (this: unknown) {
        return this;
      }),
      andWhere: jest.fn(function (this: unknown) {
        return this;
      }),
      getMany: jest.fn(() => Promise.resolve([])),
    })),
  };
}

function makeDocumentRepo(): MockRepo<unknown> {
  return {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    count: jest.fn(() => Promise.resolve(0)),
    createQueryBuilder: jest.fn(() => ({})),
  };
}

function makePublicationRepo(): MockRepo<unknown> {
  return {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    count: jest.fn(() => Promise.resolve(0)),
    createQueryBuilder: jest.fn(() => ({})),
  };
}

function makeProduitRepo(): MockRepo<unknown> {
  return {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    count: jest.fn(() => Promise.resolve(0)),
    createQueryBuilder: jest.fn(() => ({})),
  };
}

function makeAlertDispatchService() {
  return {
    dispatch: jest.fn(() => Promise.resolve()),
  };
}

function makeService(
  alertRepo: MockRepo<unknown>,
  documentRepo: MockRepo<unknown>,
  publicationRepo: MockRepo<unknown>,
  _produitRepo: MockRepo<unknown>,
  alertDispatchService: ReturnType<typeof makeAlertDispatchService>,
): DocumentAlertService {
  return new DocumentAlertService(
    alertRepo as never,
    documentRepo as never,
    publicationRepo as never,
    alertDispatchService as never,
  );
}

const VERSION_ID = 'version-1';
const PRODUCT_ID = 'product-1';
const DOCUMENT_ID = 'doc-1';

describe('DocumentAlertService', () => {
  describe('checkExpiringDocuments', () => {
    it('creates a critical alert for an expired document on a published product', async () => {
      const now = new Date();
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const alertRepo = makeAlertRepo();
      const documentRepo = makeDocumentRepo();
      const publicationRepo = makePublicationRepo();
      const produitRepo = makeProduitRepo();
      const alertDispatch = makeAlertDispatchService();

      documentRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: DOCUMENT_ID,
            versionProduitId: VERSION_ID,
            produitId: PRODUCT_ID,
            mandatory: true,
            publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            validTo: expiredDate,
            title: 'DIPA',
            type: 'DIPA',
          },
        ]),
      );

      publicationRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'pub-1',
            versionProduitId: VERSION_ID,
            endAt: null,
          },
        ]),
      );

      const service = makeService(alertRepo, documentRepo, publicationRepo, produitRepo, alertDispatch);
      await service.checkExpiringDocuments();

      expect(alertRepo.save).toHaveBeenCalled();
      const savedAlert = (alertRepo.save.mock.calls[0] as unknown[])[0] as {
        alertType: DocumentAlertType;
        severity: DocumentAlertSeverity;
      };
      expect(savedAlert.alertType).toBe(DocumentAlertType.EXPIRED);
      expect(savedAlert.severity).toBe(DocumentAlertSeverity.CRITICAL);

      expect(alertDispatch.dispatch).toHaveBeenCalled();
      const dispatchArg = (alertDispatch.dispatch.mock.calls[0] as unknown[])[0] as {
        severity: string;
      };
      expect(dispatchArg.severity).toBe(DocumentAlertSeverity.CRITICAL);
    });

    it('creates a warning alert for a document expiring within 15 days', async () => {
      const now = new Date();
      const expiresIn15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const alertRepo = makeAlertRepo();
      const documentRepo = makeDocumentRepo();
      const publicationRepo = makePublicationRepo();
      const produitRepo = makeProduitRepo();
      const alertDispatch = makeAlertDispatchService();

      documentRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: DOCUMENT_ID,
            versionProduitId: VERSION_ID,
            produitId: PRODUCT_ID,
            mandatory: true,
            publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            validTo: expiresIn15Days,
            title: 'CG',
            type: 'CG',
          },
        ]),
      );

      publicationRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'pub-1',
            versionProduitId: VERSION_ID,
            endAt: null,
          },
        ]),
      );

      const service = makeService(alertRepo, documentRepo, publicationRepo, produitRepo, alertDispatch);
      await service.checkExpiringDocuments();

      expect(alertRepo.save).toHaveBeenCalled();
      const savedAlert = (alertRepo.save.mock.calls[0] as unknown[])[0] as {
        alertType: DocumentAlertType;
        severity: DocumentAlertSeverity;
      };
      expect(savedAlert.alertType).toBe(DocumentAlertType.EXPIRING_SOON);
      expect(savedAlert.severity).toBe(DocumentAlertSeverity.WARNING);
    });

    it('creates a critical alert for a missing document on a published product', async () => {
      const alertRepo = makeAlertRepo();
      const documentRepo = makeDocumentRepo();
      const publicationRepo = makePublicationRepo();
      const produitRepo = makeProduitRepo();
      const alertDispatch = makeAlertDispatchService();

      documentRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: DOCUMENT_ID,
            versionProduitId: VERSION_ID,
            produitId: PRODUCT_ID,
            mandatory: true,
            publishedAt: null,
            validTo: null,
            title: 'SCRIPT',
            type: 'SCRIPT',
          },
        ]),
      );

      publicationRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'pub-1',
            versionProduitId: VERSION_ID,
            endAt: null,
          },
        ]),
      );

      const service = makeService(alertRepo, documentRepo, publicationRepo, produitRepo, alertDispatch);
      await service.checkExpiringDocuments();

      expect(alertRepo.save).toHaveBeenCalled();
      const savedAlert = (alertRepo.save.mock.calls[0] as unknown[])[0] as {
        alertType: DocumentAlertType;
        severity: DocumentAlertSeverity;
      };
      expect(savedAlert.alertType).toBe(DocumentAlertType.MISSING);
      expect(savedAlert.severity).toBe(DocumentAlertSeverity.CRITICAL);
    });

    it('does not create an alert for a product that is not published', async () => {
      const now = new Date();
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const alertRepo = makeAlertRepo();
      const documentRepo = makeDocumentRepo();
      const publicationRepo = makePublicationRepo();
      const produitRepo = makeProduitRepo();
      const alertDispatch = makeAlertDispatchService();

      documentRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: DOCUMENT_ID,
            versionProduitId: 'unpublished-version',
            produitId: PRODUCT_ID,
            mandatory: true,
            publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            validTo: expiredDate,
            title: 'DIPA',
            type: 'DIPA',
          },
        ]),
      );

      publicationRepo.find.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'pub-1',
            versionProduitId: 'other-version',
            endAt: null,
          },
        ]),
      );

      const service = makeService(alertRepo, documentRepo, publicationRepo, produitRepo, alertDispatch);
      await service.checkExpiringDocuments();

      expect(alertRepo.save).not.toHaveBeenCalled();
      expect(alertDispatch.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('acknowledgeAlert', () => {
    it('sets acknowledged, acknowledgedBy and acknowledgedAt', async () => {
      const alertRepo = makeAlertRepo();
      const documentRepo = makeDocumentRepo();
      const publicationRepo = makePublicationRepo();
      const produitRepo = makeProduitRepo();
      const alertDispatch = makeAlertDispatchService();

      const existingAlert = {
        id: 'alert-1',
        productId: PRODUCT_ID,
        alertType: DocumentAlertType.EXPIRED,
        severity: DocumentAlertSeverity.CRITICAL,
        message: 'test',
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        createdAt: new Date(),
      };

      alertRepo.findOne.mockImplementation(() => Promise.resolve(existingAlert));
      alertRepo.save.mockImplementation((data: unknown) => Promise.resolve(data));

      const service = makeService(alertRepo, documentRepo, publicationRepo, produitRepo, alertDispatch);
      const result = await service.acknowledgeAlert('alert-1', 'user-42');

      expect(result.acknowledged).toBe(true);
      expect(result.acknowledgedBy).toBe('user-42');
      expect(result.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('throws when the alert is not found', async () => {
      const alertRepo = makeAlertRepo();
      const documentRepo = makeDocumentRepo();
      const publicationRepo = makePublicationRepo();
      const produitRepo = makeProduitRepo();
      const alertDispatch = makeAlertDispatchService();

      alertRepo.findOne.mockImplementation(() => Promise.resolve(null));

      const service = makeService(alertRepo, documentRepo, publicationRepo, produitRepo, alertDispatch);

      await expect(service.acknowledgeAlert('nonexistent', 'user-1')).rejects.toThrow(
        'DocumentAlert not found: nonexistent',
      );
    });
  });
});
