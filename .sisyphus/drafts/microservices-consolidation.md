# Draft: Consolidation des Microservices (12 → 5-6)

## Analyse des Services Actuels

### Services et Bases de Données
| Service | Port | Base de Données |
|---------|------|-----------------|
| service-activites | 50051 | postgres-main |
| service-calendar | 50068 | postgres-main |
| service-clients | 50052 | postgres-main |
| service-commercial | 50053 | postgres-main + commercial_db |
| service-contrats | 50055 | postgres-main |
| service-documents | 50057 | postgres-main |
| service-engagement | 50061 | postgres-main + engagement_db |
| service-factures | 50059 | postgres-main |
| service-identity | 50062 | postgres-main + identity_db |
| service-logistics | 50060 | postgres-main |
| service-payments | 50063 | postgres-main |
| service-products | 50064 | postgres-main |

### Domaines Métier Identifiés
1. **Identity/Core** : identity, clients, documents
2. **Commercial** : commercial, contrats, products
3. **Finance** : factures, payments, calendar
4. **Engagement** : engagement, activites, notifications
5. **Operations** : logistics

---

## Proposition de Consolidation (5 Services)

### 1. service-core (Identity + Clients + Documents)
**Responsabilité**: Gestion des entités de base du CRM

**Fusionne**:
- service-identity (users, organisations, permissions)
- service-clients (clients, adresses, statuts)
- service-documents (pièces jointes, boîte mail)

**Justification**:
- Ces 3 services sont très liés : un client appartient à une organisation, les documents sont liés aux clients
- Tous utilisent postgres-main + identity_db
- Domaine "Core" du CRM

**Port**: 50052 (ou nouveau)
**DB**: postgres-main + identity_db

---

### 2. service-commercial (Commercial + Contrats + Products)
**Responsabilité**: Gestion du cycle de vente

**Fusionne**:
- service-commercial (apporteurs, commissions, barèmes)
- service-contrats (contrats, lignes, orchestration)
- service-products (produits, gammes, tarifs)

**Justification**:
- Cycle commercial complet : produit → contrat → commission
- Tous dépendent de commercial_db
- Domaine "Vente" du CRM

**Port**: 50053
**DB**: commercial_db + postgres-main

---

### 3. service-finance (Factures + Payments + Calendar)
**Responsabilité**: Gestion financière et paiements

**Fusionne**:
- service-factures (factures, PDF, Factur-X)
- service-payments (paiements, relances, PSP)
- service-calendar (calendrier de paiements, jours fériés)

**Justification**:
- Cycle financier complet : facture → échéance → paiement → relance
- Calendar est utilisé principalement pour les échéances de paiement
- Domaine "Finance" du CRM

**Port**: 50059
**DB**: postgres-main

---

### 4. service-engagement (Engagement + Activites)
**Responsabilité**: Communication et suivi client

**Fusionne**:
- service-engagement (emails, notifications, dashboard, KPIs)
- service-activites (tâches, événements, suivi)

**Justification**:
- Tous deux concernent l'interaction avec les clients
- Dashboard et activités sont complémentaires
- Domaine "Engagement" du CRM

**Port**: 50061
**DB**: engagement_db + postgres-main

---

### 5. service-logistics (Garde seul ou fusionne avec Finance)
**Responsabilité**: Expédition physique

**Options**:
- **Option A**: Garder seul (si Maileva est critique)
- **Option B**: Fusionner avec service-finance (envoi factures physiques)

**Port**: 50060
**DB**: postgres-main

---

## Résumé de la Consolidation

| Avant (12 services) | Après (5 services) |
|---------------------|-------------------|
| identity, clients, documents | **service-core** |
| commercial, contrats, products | **service-commercial** |
| factures, payments, calendar | **service-finance** |
| engagement, activites | **service-engagement** |
| logistics | **service-logistics** (ou fusionné) |

### Impact sur les Bases de Données

| Base | Avant | Après |
|------|-------|-------|
| identity_db | identity | service-core |
| commercial_db | commercial | service-commercial |
| engagement_db | engagement | service-engagement |
| postgres-main | Tous | Tous |

**Simplification possible**: Fusionner les 4 DB en 1-2 DB (économie RAM)

---

## Impact Mémoire Estimé

### Avant (12 services + 4 DB)
| Composant | Mémoire |
|-----------|---------|
| 4× PostgreSQL | ~5 GB |
| 12× Services | ~3-4 GB |
| Frontend + Infra | ~2 GB |
| **Total** | **~10-11 GB** |

### Après (5 services + 2-4 DB)
| Composant | Mémoire |
|-----------|---------|
| 2-4× PostgreSQL | ~2.5-5 GB |
| 5× Services | ~1.5-2 GB |
| Frontend + Infra | ~2 GB |
| **Total** | **~6-9 GB** |

**Économie**: 2-5 GB de RAM libérés

---

## Décisions Validées

- [x] Regroupement proposé : **VALIDÉ**
- [x] Logistics : **RESTE SÉPARÉ**
- [x] Bases de données : **GARDER 4 DB SÉPARÉES**

## Architecture Finale (6 Services)

1. **service-core** = identity + clients + documents
2. **service-commercial** = commercial + contrats + products  
3. **service-finance** = factures + payments + calendar
4. **service-engagement** = engagement + activites
5. **service-logistics** = seul (Maileva)

## Analyse des Dépendances (via NATS Events)

```
service-core (clients)
  └─ Publie: CLIENT_CREATED → service-engagement

service-commercial (contrats)
  └─ Publie: CONTRACT_SIGNED → service-engagement, service-core (documents)

service-finance (factures, payments)
  ├─ Publie: INVOICE_CREATED → service-engagement
  ├─ Publie: PAYMENT_RECEIVED → service-commercial, service-engagement
  └─ Publie: PAYMENT_REJECTED → service-engagement

service-engagement
  └─ Souscrit: tous les événements (hub de notifications)
```

## Ordre de Migration Recommandé

1. **service-engagement** (+ activites) - Le plus simple, peu de dépendances
2. **service-finance** (factures + payments + calendar) - Cycle financier complet
3. **service-commercial** (commercial + contrats + products) - Cycle commercial
4. **service-core** (identity + clients + documents) - Fondation

## Prêt pour Plan de Migration
