# Analyse de Conformite - Module Catalogue Produits & Partenaires CRM Winvest Capital

> **Date**: 2026-01-22
> **Version cahier des charges**: Module Catalogue Produits & Partenaires
> **Principe CRM**: Referentiel unique multi-societes / multi-marques

---

## 1. MATRICE DES EXIGENCES

### 1.1 Referentiel & Taxonomie (REF)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| REF-01 | Referentiel unique produits/familles/partenaires multi-societes | CRITIQUE | PARTIEL | `service-products/*`, `service-organisations/*` | Produits et partenaires existent mais pas unifies |
| REF-02 | Taxonomie Risque/Famille distincte | HAUTE | MANQUANT | - | Pas d'entite Risk/Famille |
| REF-03 | Partenaire/Compagnie avec type et statut | HAUTE | PARTIEL | `partenaire-marque-blanche.entity.ts` | Partenaire existe mais pas relie aux produits |
| REF-04 | Normalisation SKU unique | CRITIQUE | COUVERT | `produit.entity.ts` | Index unique (organisationId, sku) |
| REF-05 | Statuts integration (API/import/inactif) | HAUTE | MANQUANT | - | Aucun statut integration |
| REF-06 | Normalisation unites/TVA/comptes | HAUTE | PARTIEL | `produit.entity.ts:tauxTva,devise` | TVA/Devise ok, pas de comptes/unites |

### 1.2 Produit & Cycle de Vie (PRD)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| PRD-01 | CRUD produit | CRITIQUE | COUVERT | `produit.service.ts`, `products.controller.ts` | CRUD complet gRPC |
| PRD-02 | Types produit interne/partenaire | HAUTE | COUVERT | `produit.entity.ts:TypeProduit` | Enum present |
| PRD-03 | Risque/famille associee | HAUTE | PARTIEL | `produit.entity.ts:categorie` | Categorie existe, pas de Risque |
| PRD-04 | Cycle de vie (Brouillon/Test/Actif/Gele/Retire) | CRITIQUE | MANQUANT | - | Pas de statut lifecycle |
| PRD-05 | Versionning produit + dates d'effet | CRITIQUE | MANQUANT | - | Pas de product_version |
| PRD-06 | Canaux autorises (terrain/web/partenaire) | HAUTE | MANQUANT | - | Pas de publication/canaux |
| PRD-07 | Eligibilite/zone geographique | MOYENNE | MANQUANT | - | Pas de champs eligibilite |
| PRD-08 | Mappings ADV/CQ/Logistique | HAUTE | MANQUANT | - | Pas de mapping transverse |
| PRD-09 | Documents produit (DIPA/CG/...) | CRITIQUE | MANQUANT | - | Pas de gestion documentaire |
| PRD-10 | Code externe + metadata | MOYENNE | PARTIEL | `produit.entity.ts:codeExterne,metadata` | Champs existants, pas de mapping multi-systeme |

### 1.3 Tarification & Grilles (PRC)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| PRC-01 | Mode fixe (prix unitaire) | CRITIQUE | COUVERT | `produit.entity.ts:prix` | Prix de base |
| PRC-02 | Palier/etagement | HAUTE | PARTIEL | `prix-produit.entity.ts:prixMinimum/prixMaximum` | Min/Max ok, pas de paliers multi-tranches |
| PRC-03 | Recurrent mensuel/annuel | HAUTE | MANQUANT | - | Pas de recurrence produit |
| PRC-04 | Usage/consommation | HAUTE | MANQUANT | - | Pas de mode usage |
| PRC-05 | Bundle/pack | MOYENNE | MANQUANT | - | Pas de relation bundle |
| PRC-06 | Promotions planifiees | HAUTE | COUVERT | `produit.service.ts:setPromotion` | Promo avec dates |
| PRC-07 | Grille tarifaire active + par defaut | HAUTE | COUVERT | `grille-tarifaire.service.ts:findActive` | Grille active + defaut |
| PRC-08 | Prix negocie par grille (remises) | MOYENNE | PARTIEL | `prix-produit.entity.ts:remisePourcent` | Remise simple, pas de regles avancees |
| PRC-09 | Prix indexe (energie, CPI, etc.) | MOYENNE | MANQUANT | - | Non implemente |
| PRC-10 | Simulateur prix (quote interne) | MOYENNE | COUVERT | `catalog.service.ts:calculatePrice` | Calcul prix final |

### 1.4 Commissions & Revenus (COM)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| COM-01 | Scheme commission par produit/partenaire/societe/canal | CRITIQUE | MANQUANT | - | Aucun modele de commission |
| COM-02 | Paliers/degressivite commissions | HAUTE | MANQUANT | - | Non implemente |
| COM-03 | Upfront/recurrence/on-collection | HAUTE | MANQUANT | - | Non implemente |
| COM-04 | Splitting entreprise/commercial/manager | HAUTE | MANQUANT | - | Non implemente |
| COM-05 | Simulateur commission + prevision comptable | MOYENNE | MANQUANT | - | Non implemente |

### 1.5 Documents & Conformite (DOC)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| DOC-01 | Depot documents (DIPA/CG/CP/...) | CRITIQUE | MANQUANT | - | Aucun module docs |
| DOC-02 | Versionning + hash + archivage | CRITIQUE | MANQUANT | - | Non implemente |
| DOC-03 | Obligations documentaires par canal | HAUTE | MANQUANT | - | Non implemente |
| DOC-04 | Exposition documents (ADV, client, portail) | MOYENNE | MANQUANT | - | Non implemente |

### 1.6 Publication & Diffusion (PUB)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| PUB-01 | Publication produit par societe x canal | CRITIQUE | MANQUANT | - | Pas d'entite publication |
| PUB-02 | Visibilite (cache/interne/public) | HAUTE | MANQUANT | - | Non implemente |
| PUB-03 | Badges (Nouveau/Promo/Beta/Sur devis) | MOYENNE | MANQUANT | - | Non implemente |
| PUB-04 | Controle qualite avant publication | HAUTE | MANQUANT | - | Non implemente |

### 1.7 Integrations Partenaires (INT)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| INT-01 | Connecteurs API partenaires (OAuth/API key) | CRITIQUE | MANQUANT | - | Aucun connecteur |
| INT-02 | Tarification temps reel (quote assureur) | HAUTE | MANQUANT | - | Pas d'appel API partenaire |
| INT-03 | Webhooks partenaires (quote/issue/cancel) | HAUTE | MANQUANT | - | Non implemente |
| INT-04 | Sandbox/Prod + retry/alerting | HAUTE | MANQUANT | - | Non implemente |
| INT-05 | Mapping codes externes multi-systemes | MOYENNE | PARTIEL | `produit.entity.ts:codeExterne` | Champ unique, pas de mapping par systeme |

### 1.8 Mappings Transverses (MAP)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| MAP-01 | Mapping comptable (comptes/journaux/TVA) | CRITIQUE | MANQUANT | - | Non implemente |
| MAP-02 | Mapping ADV/CQ (regles, scripts) | HAUTE | MANQUANT | - | Non implemente |
| MAP-03 | Mapping logistique (livraison/stocks) | MOYENNE | MANQUANT | - | Non implemente |
| MAP-04 | Mapping dunning/facturation | MOYENNE | MANQUANT | - | Non implemente |

### 1.9 UX & Catalogue (UX)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| UX-01 | Vue 3 pans (Risque/Compagnie/Produits) | HAUTE | PARTIEL | `catalogue-page-client.tsx` | Gammes/Produits ok, pas de partenaire/risque |
| UX-02 | Fiche produit 360 (onglets) | HAUTE | PARTIEL | `catalogue-page-client.tsx` | Detail basique, pas d'onglets 360 |
| UX-03 | Wizard 5 etapes creation produit | HAUTE | MANQUANT | - | Creation simple, pas wizard |
| UX-04 | Recherche full-text + filtres | MOYENNE | PARTIEL | `catalogue-page-client.tsx` | Recherche simple, filtres limites |
| UX-05 | Actions dupliquer/export/test API | MOYENNE | MANQUANT | - | Non implemente |

### 1.10 Securite & Audit (SEC)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| SEC-01 | Roles par societe et perimetre | CRITIQUE | PARTIEL | `service-organisations/*` | Roles partenaires ok, pas roles catalogue |
| SEC-02 | Audit trail (avant/apres) | CRITIQUE | MANQUANT | - | Aucun audit catalogue |
| SEC-03 | MFA/rotation secrets connecteurs | HAUTE | MANQUANT | - | Non implemente |
| SEC-04 | RGPD/retention 10 ans | HAUTE | MANQUANT | - | Non implemente |
| SEC-05 | Anti-duplication (SKU/external IDs) | HAUTE | PARTIEL | `produit.entity.ts` | SKU unique, pas d'external ids |
| SEC-06 | Whitelist IP webhooks | MOYENNE | MANQUANT | - | Non implemente |

### 1.11 Exports & Reporting (EXP)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| EXP-01 | Exports comptables CSV/Excel | HAUTE | MANQUANT | - | Aucun export |
| EXP-02 | Export catalogue PDF/CSV | MOYENNE | MANQUANT | - | Non implemente |
| EXP-03 | Dashboards KPI (produits actifs, quote latency) | MOYENNE | MANQUANT | - | Non implemente |

### 1.12 Partenaires (PRT)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| PRT-01 | CRUD partenaire/compagnie | CRITIQUE | COUVERT | `partenaire-marque-blanche.service.ts` | CRUD complet |
| PRT-02 | Statuts partenaires | HAUTE | COUVERT | `statut-partenaire.entity.ts` | Statuts simples |
| PRT-03 | Roles & membres partenaires | HAUTE | COUVERT | `role-partenaire.service.ts`, `membre-partenaire.service.ts` | Roles/membres ok |
| PRT-04 | Credentials/API keys partenaires | HAUTE | MANQUANT | - | Pas de credentials/sandbox |

---

## 2. SYNTHESE DE COUVERTURE

### Vue globale

| Categorie | Total | Couvert | Partiel | Manquant | Taux |
|-----------|-------|---------|---------|----------|------|
| Referentiel (REF) | 6 | 1 | 3 | 2 | 17% |
| Produit (PRD) | 10 | 2 | 2 | 6 | 20% |
| Tarification (PRC) | 10 | 4 | 2 | 4 | 40% |
| Commissions (COM) | 5 | 0 | 0 | 5 | 0% |
| Documents (DOC) | 4 | 0 | 0 | 4 | 0% |
| Publication (PUB) | 4 | 0 | 0 | 4 | 0% |
| Integrations (INT) | 5 | 0 | 1 | 4 | 0% |
| Mappings (MAP) | 4 | 0 | 0 | 4 | 0% |
| UX (UX) | 5 | 0 | 3 | 2 | 0% |
| Securite/Audit (SEC) | 6 | 0 | 2 | 4 | 0% |
| Exports/Reporting (EXP) | 3 | 0 | 0 | 3 | 0% |
| Partenaires (PRT) | 4 | 3 | 0 | 1 | 75% |
| **TOTAL** | **66** | **10** | **13** | **43** | **15%** |

### Couverture par criticite

| Criticite | Total | Couvert | Partiel | Manquant |
|-----------|-------|---------|---------|----------|
| CRITIQUE | 20 | 4 | 3 | 13 |
| HAUTE | 34 | 5 | 8 | 21 |
| MOYENNE | 12 | 1 | 2 | 9 |

---

## 3. ECARTS CRITIQUES A COMBLER

### P0 - Bloquants (priorite)

| ID | Ecart | Impact | Effort estime |
|----|-------|--------|---------------|
| PRD-04 | Cycle de vie produit (statuts) | Publication non controlee | 2-3j |
| PRD-05 | Versionning + dates d'effet | Impossible de planifier/rollback | 3-5j |
| DOC-01/02 | Documents + archivage + hash | Non conformite legale | 3-5j |
| PUB-01 | Publication par societe/canal | Pas de diffusion controlee | 3-4j |
| INT-01/03 | Connecteurs + webhooks partenaires | Integrations manuelles | 5-8j |
| COM-01 | Scheme commissions | Revenus partenaires non parametrables | 3-5j |
| SEC-02 | Audit trail | Traçabilite insuffisante | 2-3j |

### P1 - Importants (phase 2)

| ID | Ecart | Impact | Effort estime |
|----|-------|--------|---------------|
| PRC-03/04/09 | Tarification recurrente/usage/indexee | Produits energie/telecom non supportes | 5-7j |
| MAP-01/02 | Mapping compta + ADV/CQ | Flux aval incomplet | 4-6j |
| UX-03 | Wizard creation produit | Parametrage lourd, erreurs | 3-5j |
| INT-04 | Sandbox/Prod + retry/alerting | Risque operational | 3-4j |

### P2 - Ameliorations (phase 3)

| ID | Ecart | Impact | Effort estime |
|----|-------|--------|---------------|
| UX-01/04 | Recherche avancée + 3 pans | Navigation limitee | 2-3j |
| EXP-01/02 | Exports compta/catalogue | Exploitation manuelle | 2-3j |
| SEC-03/04 | MFA/retention RGPD | Conformite incomplete | 2-3j |

---

## 4. RECOMMANDATIONS D'IMPLEMENTATION

### 4.1 Architecture recommandee

```
services/service-products/src/
  modules/
    version/              # NEW - product_version, publication, lifecycle
    document/             # NEW - documents produits + hash
    commission/           # NEW - commission_scheme + tiers
    publication/          # NEW - publication par societe/canal
    integration/          # NEW - connecteurs + webhooks
    mapping/              # NEW - compta/ADV/logistique
    audit/                # NEW - audit trail catalogue
```

### 4.2 Priorites (propose)

**Sprint 1 (2 semaines)**
1. Cycle de vie + versionning produit
2. Publication par societe/canal + controles
3. Documents produits (DIPA/CG) + hash

**Sprint 2 (2 semaines)**
1. Commissions scheme + paliers
2. Integrations partenaires (connecteur de base + webhooks)
3. Mappings compta/ADV essentiels

**Sprint 3 (2 semaines)**
1. Tarification recurrente/usage/indexee
2. Exports compta/catalogue
3. Audit trail et securite (MFA, rotation)

---

## 5. CHECKLIST DE VALIDATION FINALE

- [ ] Cycle de vie + versionning avec dates d'effet
- [ ] Publication par societe/canal avec controles qualite
- [ ] Documents obligatoires DIPA/CG/CP + hash + archivage
- [ ] Commissions scheme complet (paliers, split)
- [ ] Integrations partenaires + webhooks
- [ ] Mappings compta/ADV/logistique
- [ ] Exports CSV/Excel
- [ ] Audit trail complet + RGPD

---

*Document genere automatiquement - A maintenir a jour avec chaque evolution du module*
