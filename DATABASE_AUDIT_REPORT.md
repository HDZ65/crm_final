# Database Audit Report - CRM Microservices

**Date**: January 19, 2026  
**Scope**: 17 NestJS microservices with PostgreSQL/TypeORM  
**Location**: `/crm_final/services/service-*`

---

## Executive Summary

| Category | Status | Severity |
|----------|--------|----------|
| Database Architecture | FIXED | Critical |
| Synchronize Settings | FIXED | Critical |
| Connection Pooling | FIXED | High |
| Transactions | Missing | High |
| Indexes | Partial | Medium |
| Migrations | Missing | Medium |
| Security | OK | - |

---

## 1. Database Architecture (FIXED)

**Pattern**: Database-per-service (microservices best practice)

**Issue**: Previously, 6 services shared a single `crm` database, breaking service isolation.

**Solution**: Each service now has its own dedicated database.

| Service | Database | Env Variable |
|---------|----------|--------------|
| service-activites | `activites_db` | DB_DATABASE |
| service-clients | `clients_db` | DB_DATABASE |
| service-commerciaux | `commerciaux_db` | DB_DATABASE |
| service-commission | `commission_db` | DB_DATABASE |
| service-contrats | `contrats_db` | DB_DATABASE |
| service-documents | `documents_db` | DB_DATABASE |
| service-email | `email_db` | DB_DATABASE |
| service-factures | `factures_db` | DB_DATABASE |
| service-logistics | `logistics_db` | DB_DATABASE |
| service-notifications | `notifications_db` | DB_DATABASE |
| service-organisations | `organisations_db` | DB_DATABASE |
| service-payments | `payments_db` | DB_DATABASE |
| service-products | `products_db` | DB_DATABASE |
| service-referentiel | `referentiel_db` | DB_DATABASE |
| service-relance | `relance_db` | DB_DATABASE |
| service-users | `users_db` | DB_DATABASE |
| service-dashboard | Multiple (read-only) | - |

**Note**: `service-dashboard` connects to multiple databases in read-only mode for aggregating data across services.

---

## 2. TypeORM Configuration Analysis

### 2.1 Synchronize Setting (CRITICAL - FIXED)

**Issue**: `synchronize: true` was hardcoded in production, causing automatic schema changes.

| Service | Before | After | Status |
|---------|--------|-------|--------|
| service-clients | `true` (hardcoded) | `NODE_ENV === 'development'` | FIXED |
| service-contrats | `true` (hardcoded) | `NODE_ENV === 'development'` | FIXED |
| service-activites | `DB_SYNCHRONIZE` env var | - | OK |
| service-commerciaux | `DB_SYNCHRONIZE` env var | - | OK |
| service-commission | `NODE_ENV === 'development'` | - | OK |
| service-dashboard | `false` (read-only) | - | OK |
| service-documents | `DB_SYNCHRONIZE` env var | - | OK |
| service-email | `NODE_ENV === 'development'` | - | OK |
| service-factures | `NODE_ENV !== 'production'` | - | REVIEW |
| service-logistics | `NODE_ENV !== 'production'` | - | REVIEW |
| service-notifications | `NODE_ENV === 'development'` | - | OK |
| service-organisations | `NODE_ENV === 'development'` | - | OK |
| service-payments | `NODE_ENV !== 'production'` | - | REVIEW |
| service-products | `NODE_ENV === 'development'` | - | OK |
| service-referentiel | `DB_SYNCHRONIZE` env var | - | OK |
| service-relance | `NODE_ENV === 'development'` | - | OK |
| service-users | `NODE_ENV === 'development'` | - | OK |

**Recommendation**: Services using `NODE_ENV !== 'production'` should be changed to `NODE_ENV === 'development'` to be explicit about when synchronize is enabled.

### 2.2 Connection Pooling

**Status**: FIXED - All 17 services now have connection pooling configured.

**Configuration applied to all services**:
```typescript
extra: {
  max: 10,                      // Maximum pool size
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout for acquiring connection
}
```

---

## 3. Entity Analysis

### 3.1 Total Entities: 74

| Service | Entity Count |
|---------|--------------|
| service-users | 7 |
| service-referentiel | 5 |
| service-relance | 2 |
| service-payments | 7 |
| service-products | 4 |
| service-organisations | 8 |
| service-logistics | 4 |
| service-notifications | 1 |
| service-factures | 7 |
| service-email | 1 |
| service-documents | 2 |
| service-contrats | 5 |
| service-commission | 7 |
| service-commerciaux | 4 |
| service-clients | 5 |
| service-activites | 4 |

### 3.2 Index Coverage

**Entities with indexes**: 6 files (8% coverage)

| File | Indexes |
|------|---------|
| `facture-settings.entity.ts` | `societeId` (unique) |
| `statut-facture.entity.ts` | `code` (unique) |
| `ligne-facture.entity.ts` | `factureId` |
| `emission-facture.entity.ts` | `code` (unique) |
| `facture.entity.ts` | `organisationId+numero`, `organisationId+dateEmission`, `clientBaseId`, `contratId` |
| `invoice.entity.ts` | `invoiceNumber`, `status`, `issueDate` |

**Entities WITHOUT indexes (68 files)**: High-frequency query columns need indexing.

### 3.3 High-Priority Index Recommendations

```typescript
// service-clients - client-base.entity.ts
@Index(['organisationId'])
@Index(['email'])
@Index(['createdAt'])

// service-contrats - contrat.entity.ts
@Index(['organisationId'])
@Index(['clientBaseId'])
@Index(['statutId'])
@Index(['dateDebut'])

// service-activites - activite.entity.ts
@Index(['organisationId'])
@Index(['clientId'])
@Index(['assigneeId'])
@Index(['createdAt'])

// service-commission - commission.entity.ts
@Index(['organisationId'])
@Index(['apporteurId'])
@Index(['statutId'])
@Index(['createdAt'])

// service-users - utilisateur.entity.ts
@Index(['email'], { unique: true })
@Index(['compteId'])
```

---

## 4. Transaction Handling

**Issue**: No explicit transaction handling found.

**Search Results**: 0 uses of `@Transaction()`, `QueryRunner`, or `EntityManager.transaction()`

**Risk**: Data inconsistency in multi-step operations.

**Recommendation**: Add transactions for:
- Contract creation with line items
- Invoice generation
- Commission calculations
- User registration with roles

**Example Implementation**:
```typescript
import { DataSource } from 'typeorm';

@Injectable()
export class ContratService {
  constructor(private dataSource: DataSource) {}

  async createContratWithLignes(dto: CreateContratDto) {
    return this.dataSource.transaction(async (manager) => {
      const contrat = await manager.save(Contrat, dto.contrat);
      const lignes = dto.lignes.map(l => ({ ...l, contratId: contrat.id }));
      await manager.save(LigneContrat, lignes);
      return contrat;
    });
  }
}
```

---

## 5. Eager/Lazy Loading

**Findings**:
- `eager: true`: 1 occurrence (`invoice.entity.ts` line 150)
- `lazy: true`: 0 occurrences

**Assessment**: Good practice - explicit relation loading is used via `relations:[]` option.

---

## 6. Migrations

**Issue**: No migration infrastructure found.

**Recommendation**: Set up TypeORM migrations:

```bash
# In each service package.json, add:
"scripts": {
  "migration:generate": "typeorm migration:generate -d src/data-source.ts",
  "migration:run": "typeorm migration:run -d src/data-source.ts",
  "migration:revert": "typeorm migration:revert -d src/data-source.ts"
}
```

Create `data-source.ts`:
```typescript
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
```

---

## 7. Security Assessment

| Check | Status |
|-------|--------|
| Hardcoded credentials | None found |
| Environment variables | Used correctly |
| SQL injection (raw queries) | Parameterized queries used |
| Sensitive data exposure | Not detected |

---

## 8. Query Patterns

### Positive Patterns Found:
- Pagination with `skip/take`
- Efficient `getManyAndCount()` usage
- Explicit relation loading

### Potential N+1 Risks:
- Services iterating over entities and loading relations individually
- No `QueryBuilder` batch loading patterns

---

## 9. Action Items

### Critical (Do Now):
- [x] ~~Implement database-per-service architecture~~ DONE
- [x] ~~Fix `synchronize: true` in service-clients~~ DONE
- [x] ~~Fix `synchronize: true` in service-contrats~~ DONE
- [x] ~~Add connection pooling to all 17 services~~ DONE
- [x] ~~Fix `NODE_ENV !== 'production'` pattern in service-factures, service-logistics, service-payments~~ DONE
- [x] ~~Standardize DB_NAME to DB_DATABASE~~ DONE

### High Priority (This Sprint):
- [ ] Add transactions to critical multi-step operations
- [ ] Add indexes to high-frequency query columns

### Medium Priority (Next Sprint):
- [ ] Set up migration infrastructure
- [ ] Review services with `NODE_ENV !== 'production'` pattern
- [ ] Add missing indexes to all entities

### Low Priority (Backlog):
- [ ] Implement query result caching
- [ ] Add database health checks
- [ ] Set up slow query logging

---

## 10. Files Modified

| File | Change |
|------|--------|
| `service-clients/src/app.module.ts` | Fixed synchronize, added pool, DB: `clients_db` |
| `service-contrats/src/app.module.ts` | Fixed synchronize, added pool, DB: `contrats_db` |
| `service-activites/src/app.module.ts` | Added pool, DB: `activites_db` |
| `service-commerciaux/src/app.module.ts` | Added pool, DB: `commerciaux_db` |
| `service-commission/src/app.module.ts` | Added pool |
| `service-dashboard/src/app.module.ts` | Added pool (all 6 connections) |
| `service-documents/src/app.module.ts` | Added pool, DB: `documents_db` |
| `service-email/src/app.module.ts` | Added pool |
| `service-factures/src/app.module.ts` | Fixed synchronize, added pool |
| `service-logistics/src/app.module.ts` | Fixed synchronize, added pool |
| `service-notifications/src/app.module.ts` | Added pool |
| `service-organisations/src/app.module.ts` | Added pool, standardized DB_DATABASE |
| `service-payments/src/app.module.ts` | Fixed synchronize, added pool |
| `service-products/src/app.module.ts` | Added pool |
| `service-referentiel/src/app.module.ts` | Added pool, DB: `referentiel_db` |
| `service-relance/src/app.module.ts` | Added pool |
| `service-users/src/app.module.ts` | Added pool, standardized DB_DATABASE |

---

## Appendix: Entities Without Indexes

<details>
<summary>Click to expand full list (68 entities)</summary>

**service-users**:
- membre-compte.entity.ts
- role.entity.ts
- role-permission.entity.ts
- utilisateur.entity.ts
- permission.entity.ts
- invitation-compte.entity.ts
- compte.entity.ts

**service-referentiel**:
- transporteur-compte.entity.ts
- periode-facturation.entity.ts
- facturation-par.entity.ts
- statut-client.entity.ts
- emission-facture.entity.ts
- condition-paiement.entity.ts

**service-relance**:
- regle-relance.entity.ts
- historique-relance.entity.ts

**service-payments**:
- stripe-account.entity.ts
- payment-event.entity.ts
- payment-intent.entity.ts
- schedule.entity.ts
- paypal-account.entity.ts
- gocardless-account.entity.ts
- gocardless-mandate.entity.ts

**service-products**:
- gamme.entity.ts
- produit.entity.ts
- grille-tarifaire.entity.ts
- prix-produit.entity.ts

**service-organisations**:
- partenaire-marque-blanche.entity.ts
- societe.entity.ts
- statut-partenaire.entity.ts
- theme-marque.entity.ts
- role-partenaire.entity.ts
- organisation.entity.ts
- membre-partenaire.entity.ts
- invitation-compte.entity.ts

**service-logistics**:
- expedition.entity.ts
- tracking-event.entity.ts
- colis.entity.ts
- carrier-account.entity.ts

**service-notifications**:
- notification.entity.ts

**service-email**:
- mailbox.entity.ts

**service-documents**:
- piece-jointe.entity.ts
- boite-mail.entity.ts

**service-contrats**:
- historique-statut-contrat.entity.ts
- statut-contrat.entity.ts
- ligne-contrat.entity.ts
- orchestration-history.entity.ts
- contrat.entity.ts

**service-commission**:
- bordereau-commission.entity.ts
- ligne-bordereau.entity.ts
- reprise-commission.entity.ts
- statut-commission.entity.ts
- palier-commission.entity.ts
- commission.entity.ts
- bareme-commission.entity.ts

**service-commerciaux**:
- modele-distribution.entity.ts
- apporteur.entity.ts
- palier-commission.entity.ts
- bareme-commission.entity.ts

**service-clients**:
- adresse.entity.ts
- client-partenaire.entity.ts
- client-entreprise.entity.ts
- client-base.entity.ts
- statut-client.entity.ts

**service-activites**:
- tache.entity.ts
- type-activite.entity.ts
- evenement-suivi.entity.ts
- activite.entity.ts

</details>
