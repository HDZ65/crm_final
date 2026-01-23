# Analyse de Conformite - Module Commission CRM Winvest Capital

> **Date**: 2026-01-22
> **Version cahier des charges**: Module Commission v1.0
> **Principe CRM**: Outil flexible, adaptable a plusieurs situations metier

---

## 1. MATRICE DES EXIGENCES

### 1.1 Moteur de Calcul (CAL)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| CAL-01 | Base de calcul: Cotisation HT | CRITIQUE | COUVERT | `bareme-commission.entity.ts:BaseCalcul.COTISATION_HT` | Enum presente |
| CAL-02 | Base de calcul: % CA | CRITIQUE | COUVERT | `bareme-commission.entity.ts:BaseCalcul.CA_HT` | Enum presente |
| CAL-03 | Base de calcul: Forfait fixe | CRITIQUE | COUVERT | `bareme-commission.entity.ts:BaseCalcul.FORFAIT` | Enum presente |
| CAL-04 | Type calcul: Fixe | CRITIQUE | COUVERT | `commission-engine.service.ts:82-84` | Switch case implemente |
| CAL-05 | Type calcul: Pourcentage | CRITIQUE | COUVERT | `commission-engine.service.ts:85-87` | Switch case implemente |
| CAL-06 | Type calcul: Palier | CRITIQUE | PARTIEL | `commission-engine.service.ts:88-97` | Logique basique, pas de cumul sophistique |
| CAL-07 | Type calcul: Mixte (fixe + %) | HAUTE | PARTIEL | `commission-engine.service.ts:88-97` | Meme branche que palier, logique incomplete |
| CAL-08 | Commissions recurrentes sur encaissement | CRITIQUE | MANQUANT | - | Champs `recurrenceActive`, `tauxRecurrence` existent mais moteur ne genere pas de lignes recurrentes |
| CAL-09 | Duree de recurrence (illimitee ou N mois) | HAUTE | MANQUANT | `bareme-commission.entity.ts:dureeRecurrenceMois` | Champ existe mais non utilise dans le moteur |
| CAL-10 | Primes paliers (volume, CA, produit) | HAUTE | PARTIEL | `commission-engine.service.ts:101-117` | Logique basique, pas de cumul par periode |
| CAL-11 | Repartition multi-acteurs (commercial/manager/agence/entreprise) | HAUTE | PARTIEL | `bareme-commission.entity.ts:84-94` | Champs existent mais pas de repartition effective dans le calcul |
| CAL-12 | Journalisation du calcul (version bareme, base, taux) | CRITIQUE | MANQUANT | - | Aucun audit log dans le moteur |
| CAL-13 | Non-retroactivite des baremes | HAUTE | PARTIEL | `bareme.service.ts:findApplicable` | Selection par date mais pas de verrouillage version |

### 1.2 Reprises et Reports (REP)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| REP-01 | Types reprise: Resiliation | CRITIQUE | COUVERT | `reprise-commission.entity.ts:TypeReprise.RESILIATION` | Enum presente |
| REP-02 | Types reprise: Impaye | CRITIQUE | COUVERT | `reprise-commission.entity.ts:TypeReprise.IMPAYE` | Enum presente |
| REP-03 | Types reprise: Annulation | HAUTE | COUVERT | `reprise-commission.entity.ts:TypeReprise.ANNULATION` | Enum presente |
| REP-04 | Types reprise: Regularisation | HAUTE | COUVERT | `reprise-commission.entity.ts:TypeReprise.REGULARISATION` | Enum presente |
| REP-05 | Fenetres de reprise configurables (3/6/12 mois) | CRITIQUE | PARTIEL | `bareme-commission.entity.ts:dureeReprisesMois` | Champ existe, defaut 3 mois, mais moteur utilise valeur fixe |
| REP-06 | Calcul automatique montant reprise | HAUTE | PARTIEL | `commission-engine.service.ts:261-307` | Calcul 100% par defaut, pas de prorata selon fenetre |
| REP-07 | Reports negatifs multi-periodes | CRITIQUE | MANQUANT | - | Aucune logique de report negatif |
| REP-08 | Regularisation automatique apres recouvrement | HAUTE | MANQUANT | - | Pas de detection ni generation auto |
| REP-09 | Statuts reprise (en_attente, appliquee, annulee) | HAUTE | COUVERT | `reprise-commission.entity.ts:StatutReprise` | Enum complete |
| REP-10 | Application reprise sur bordereau suivant | HAUTE | COUVERT | `commission-engine.service.ts:215-232` | Logique presente dans genererBordereau |

### 1.3 Acomptes (ACO)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| ACO-01 | Gestion des acomptes (avances) | MOYENNE | PARTIEL | `commission.entity.ts:montantAcomptes` | Champ existe mais aucune logique de gestion |
| ACO-02 | Plafond acompte a 50% du net estime | MOYENNE | MANQUANT | - | Aucune regle de plafond |
| ACO-03 | Regularisation automatique des acomptes | MOYENNE | MANQUANT | - | Pas de logique d'apurement |

### 1.4 Validation ADV et Bordereaux (BRD)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| BRD-01 | Statuts bordereau (brouillon, valide, exporte, archive) | CRITIQUE | COUVERT | `bordereau-commission.entity.ts:StatutBordereau` | Enum complete |
| BRD-02 | Preselection automatique lignes eligibles | HAUTE | PARTIEL | `commissions-page-client.tsx` | Cote client uniquement, pas cote serveur |
| BRD-03 | Deselection manuelle avec motif obligatoire | HAUTE | COUVERT | `commissions-page-client.tsx:402-432` | Dialog de deselection avec motif |
| BRD-04 | Calcul dynamique totaux (Brut/Reprises/Net) | HAUTE | COUVERT | `commissions-page-client.tsx:479-505` | Calcul temps reel cote client |
| BRD-05 | Validation finale avec verrouillage | HAUTE | PARTIEL | `bordereau.service.ts:88-94` | Validation change statut mais pas de verrou technique |
| BRD-06 | Horodatage validation | HAUTE | COUVERT | `bordereau-commission.entity.ts:dateValidation` | Champ present et mis a jour |
| BRD-07 | Generation bordereau par apporteur/periode | CRITIQUE | COUVERT | `commission-engine.service.ts:155-259` | Methode genererBordereau complete |
| BRD-08 | Lignes par type (commission, reprise, acompte, prime, regularisation) | HAUTE | COUVERT | `ligne-bordereau.entity.ts:TypeLigne` | Enum complete |
| BRD-09 | Statuts ligne (selectionnee, deselectionnee, validee, rejetee) | HAUTE | COUVERT | `ligne-bordereau.entity.ts:StatutLigne` | Enum complete |

### 1.5 Exports (EXP)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| EXP-01 | Export PDF bordereau | CRITIQUE | MANQUANT | `bordereau.service.ts:96-104` | URL simulee, pas de generation reelle |
| EXP-02 | Export Excel bordereau | CRITIQUE | MANQUANT | `bordereau.service.ts:96-104` | URL simulee, pas de generation reelle |
| EXP-03 | Sections Total/Lineaire/Reprises | HAUTE | MANQUANT | - | Pas de structure de document |
| EXP-04 | Hash SHA-256 fichiers exportes | HAUTE | MANQUANT | `bordereau-commission.entity.ts` | Pas de champ hash |
| EXP-05 | Export CSV commissions (client) | MOYENNE | COUVERT | `commissions-page-client.tsx:571-601` | Export CSV fonctionnel cote client |
| EXP-06 | API JSON pour integrations | MOYENNE | COUVERT | `commission.controller.ts` | API gRPC complete |
| EXP-07 | Archivage immutable bordereaux | HAUTE | MANQUANT | - | Pas de mecanisme d'archivage |

### 1.6 Baremes et Configuration (CFG)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| CFG-01 | CRUD baremes | CRITIQUE | COUVERT | `bareme.service.ts`, `commission.controller.ts` | Toutes operations presentes |
| CFG-02 | CRUD paliers | CRITIQUE | COUVERT | `palier.service.ts`, `commission.controller.ts` | Toutes operations presentes |
| CFG-03 | Versionning baremes avec date effet | HAUTE | PARTIEL | `bareme-commission.entity.ts:version, dateEffet, dateFin` | Champs presents mais pas d'historisation automatique |
| CFG-04 | Historisation versions (payload JSON immuable) | HAUTE | MANQUANT | - | Pas de table baremes_versions |
| CFG-05 | Filtrage par produit/societe/profil/canal | HAUTE | COUVERT | `bareme.service.ts:findApplicable` | Filtres multi-criteres |
| CFG-06 | UI gestion baremes | HAUTE | COUVERT | `commission-config-dialog.tsx`, `baremes-list.tsx` | Interface complete |
| CFG-07 | UI gestion apporteurs | HAUTE | COUVERT | `commission-config-dialog.tsx`, `apporteurs-list.tsx` | Interface complete |
| CFG-08 | Activation/desactivation bareme | HAUTE | COUVERT | `bareme-commission.entity.ts:actif` | Champ present + toggle |

### 1.7 Profils de Remuneration (PRF)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| PRF-01 | Profil VRP (commerciaux) | CRITIQUE | PARTIEL | `bareme-commission.entity.ts:profilRemuneration` | Champ existe mais pas de regles specifiques |
| PRF-02 | Profil Manager (primes equipe, retrocessions) | HAUTE | MANQUANT | - | Pas de logique de primes equipe |
| PRF-03 | Profil Directeur (% sur conseillers) | HAUTE | MANQUANT | - | Pas de logique de retrocession |
| PRF-04 | Profil Partenaire externe | HAUTE | PARTIEL | - | Memes regles que VRP, pas de specificites |
| PRF-05 | Primes cumulables par produit | MOYENNE | PARTIEL | `palier-commission.entity.ts:cumulable` | Champ existe mais logique incomplete |
| PRF-06 | Bonus volume (N contrats = X euros) | MOYENNE | PARTIEL | `palier-commission.entity.ts` | Structure existe, calcul basique |

### 1.8 Statuts et Workflow (WKF)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| WKF-01 | Statuts commission (en_attente, validee, reprise, payee, contestee) | CRITIQUE | PARTIEL | `statut-commission.entity.ts` | Table statuts mais pas tous les statuts requis |
| WKF-02 | Liaison contrat -> commission | HAUTE | COUVERT | `commission.entity.ts:contratId` | FK presente |
| WKF-03 | Liaison echeance -> commission | HAUTE | MANQUANT | - | Pas de champ echeanceId |
| WKF-04 | Declenchement auto sur validation CQ | CRITIQUE | MANQUANT | - | Pas d'integration avec module contrats |
| WKF-05 | Declenchement auto sur encaissement | CRITIQUE | MANQUANT | - | Pas d'evenements depuis module paiements |
| WKF-06 | Workflow contestation (2 mois) | MOYENNE | MANQUANT | - | Pas de mecanisme de contestation |

### 1.9 Reporting et KPI (KPI)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| KPI-01 | Dashboard commissions (brut, net, reprises) | HAUTE | PARTIEL | `commissions-page-client.tsx:686-719` | Cartes resumees presentes |
| KPI-02 | Taux de reprise | HAUTE | MANQUANT | - | Pas de KPI calcule |
| KPI-03 | Taux de recurrence | HAUTE | MANQUANT | - | Pas de KPI calcule |
| KPI-04 | Comparatifs temporels (M-1, N-1) | HAUTE | MANQUANT | - | Pas de comparaison |
| KPI-05 | Comparatifs par produit/equipe/apporteur | HAUTE | MANQUANT | - | Pas de filtres avances |
| KPI-06 | Snapshots KPI mensuels | MOYENNE | MANQUANT | - | Pas de table snapshots_kpi |
| KPI-07 | Exports analytiques direction | MOYENNE | MANQUANT | - | Pas d'exports consolides |
| KPI-08 | Graphiques interactifs | MOYENNE | MANQUANT | - | Pas de visualisations |

### 1.10 Securite et Audit (SEC)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| SEC-01 | Gestion roles (ADV, Compta, Direction, Partenaire) | CRITIQUE | PARTIEL | - | Roles CRM globaux, pas specifiques commissions |
| SEC-02 | Audit trail actions (validation, modification, export) | CRITIQUE | MANQUANT | - | Pas de module audit dans service-commission |
| SEC-03 | Journalisation connexions | HAUTE | PARTIEL | - | Gere au niveau CRM global |
| SEC-04 | Hash SHA-256 bordereaux | HAUTE | MANQUANT | - | Pas de signature numerique |
| SEC-05 | Chiffrement donnees sensibles | HAUTE | PARTIEL | - | TLS en transit, pas de chiffrement au repos specifique |
| SEC-06 | Conformite RGPD (conservation 5 ans max) | HAUTE | PARTIEL | - | Pas de politique de retention implementee |
| SEC-07 | Droit d'acces/rectification | MOYENNE | PARTIEL | - | Pas d'interface dediee |

### 1.11 UX et Ergonomie (UX)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| UX-01 | Fiche commission detaillee | HAUTE | COUVERT | `commission-detail-dialog.tsx` | Dialog complet |
| UX-02 | Liste bordereaux avec filtres | HAUTE | COUVERT | `bordereaux-list.tsx` | Liste fonctionnelle |
| UX-03 | Liste reprises avec filtres | HAUTE | COUVERT | `reprises-list.tsx` | Liste fonctionnelle |
| UX-04 | Cases a cocher validation | HAUTE | COUVERT | `commissions-page-client.tsx` | Selection multi-lignes |
| UX-05 | Recalcul temps reel totaux | HAUTE | COUVERT | `commissions-page-client.tsx:479-505` | Calcul instantane |
| UX-06 | Codes couleur statuts | HAUTE | PARTIEL | - | Quelques badges mais pas de charte complete |
| UX-07 | Recherche rapide | MOYENNE | MANQUANT | - | Pas de recherche globale |
| UX-08 | Espace gestion baremes (back-office) | HAUTE | COUVERT | `commission-config-dialog.tsx` | Interface complete |
| UX-09 | Historique/archivage consultable | HAUTE | MANQUANT | - | Pas d'ecran d'historique |
| UX-10 | Responsive (bureau, tablette) | MOYENNE | COUVERT | Tailwind CSS | Design responsive |

### 1.12 Flexibilite CRM (FLX)

| ID | Exigence | Criticite | Statut | Preuve/Fichier | Commentaire |
|----|----------|-----------|--------|----------------|-------------|
| FLX-01 | Multi-organisation | CRITIQUE | COUVERT | `*.entity.ts:organisationId` | Toutes entites ont organisationId |
| FLX-02 | Multi-societe par organisation | HAUTE | PARTIEL | `bareme-commission.entity.ts:societeId` | Champ existe mais pas exploite partout |
| FLX-03 | Baremes configurables sans code | CRITIQUE | COUVERT | UI + API | Gestion complete via interface |
| FLX-04 | Paliers configurables sans code | HAUTE | COUVERT | UI + API | Gestion complete via interface |
| FLX-05 | Regles de reprise parametrables | HAUTE | PARTIEL | `bareme-commission.entity.ts:dureeReprisesMois, tauxReprise` | Champs existent mais moteur rigide |
| FLX-06 | Profils de remuneration extensibles | HAUTE | PARTIEL | `bareme-commission.entity.ts:profilRemuneration` | Champ texte libre mais pas de logique associee |
| FLX-07 | Types produit extensibles | HAUTE | COUVERT | `bareme-commission.entity.ts:typeProduit` | Champ texte libre |
| FLX-08 | Canaux de vente configurables | MOYENNE | COUVERT | `bareme-commission.entity.ts:canalVente` | Champ texte libre |
| FLX-09 | Statuts personnalisables | HAUTE | COUVERT | `statut-commission.entity.ts` | Table de reference dynamique |
| FLX-10 | API ouverte pour integrations | HAUTE | COUVERT | gRPC + proto | API complete et documentee |

---

## 2. SYNTHESE DE COUVERTURE

### Vue globale

| Categorie | Total | Couvert | Partiel | Manquant | Taux |
|-----------|-------|---------|---------|----------|------|
| Moteur de Calcul (CAL) | 13 | 5 | 5 | 3 | 38% |
| Reprises et Reports (REP) | 10 | 5 | 2 | 3 | 50% |
| Acomptes (ACO) | 3 | 0 | 1 | 2 | 0% |
| Validation/Bordereaux (BRD) | 9 | 6 | 2 | 1 | 67% |
| Exports (EXP) | 7 | 2 | 0 | 5 | 29% |
| Configuration (CFG) | 8 | 6 | 2 | 0 | 75% |
| Profils (PRF) | 6 | 0 | 4 | 2 | 0% |
| Workflow (WKF) | 6 | 1 | 1 | 4 | 17% |
| Reporting KPI (KPI) | 8 | 0 | 1 | 7 | 0% |
| Securite/Audit (SEC) | 7 | 0 | 4 | 3 | 0% |
| UX/Ergonomie (UX) | 10 | 6 | 2 | 2 | 60% |
| Flexibilite CRM (FLX) | 10 | 6 | 4 | 0 | 60% |
| **TOTAL** | **97** | **37** | **28** | **32** | **38%** |

### Couverture par criticite

| Criticite | Total | Couvert | Partiel | Manquant |
|-----------|-------|---------|---------|----------|
| CRITIQUE | 28 | 12 | 8 | 8 |
| HAUTE | 54 | 19 | 17 | 18 |
| MOYENNE | 15 | 6 | 3 | 6 |

---

## 3. ECARTS CRITIQUES A COMBLER

### P0 - Bloquants (a traiter en priorite)

| ID | Ecart | Impact | Effort estime |
|----|-------|--------|---------------|
| CAL-08 | Commissions recurrentes non implementees | Perte de revenus recurrents non suivis | 3-5j |
| CAL-12 | Pas d'audit trail calculs | Non-conformite legale, impossibilite de justifier | 2-3j |
| REP-07 | Reports negatifs absents | Incoherence comptable si reprise > brut | 2-3j |
| EXP-01/02 | Export PDF/Excel non fonctionnel | Impossible de diffuser les bordereaux | 3-5j |
| WKF-04/05 | Pas d'integration contrats/encaissements | Module isole, calculs manuels | 5-8j |
| SEC-02 | Pas d'audit trail commissions | Non-conformite VRP et RGPD | 2-3j |

### P1 - Importants (phase 2)

| ID | Ecart | Impact | Effort estime |
|----|-------|--------|---------------|
| CAL-06/07 | Calcul palier/mixte incomplet | Primes incorrectes | 2-3j |
| CAL-11 | Repartition multi-acteurs non effective | Pas de split manager/directeur | 3-4j |
| CFG-04 | Pas d'historisation versions baremes | Impossible de recalculer a l'identique | 2-3j |
| PRF-02/03 | Profils manager/directeur absents | Pas de primes equipe ni retrocessions | 3-5j |
| KPI-01-08 | Reporting KPI absent | Pas de pilotage direction | 5-8j |
| EXP-04/07 | Hash SHA-256 et archivage absents | Non-conformite securite | 2-3j |

### P2 - Ameliorations (phase 3)

| ID | Ecart | Impact | Effort estime |
|----|-------|--------|---------------|
| ACO-01-03 | Gestion acomptes incomplete | Fonctionnalite non utilisable | 2-3j |
| WKF-06 | Workflow contestation absent | Pas de recours commercial | 2-3j |
| REP-08 | Regularisation auto absente | Traitement manuel recouvrements | 1-2j |
| UX-07/09 | Recherche et historique absents | Ergonomie limitee | 2-3j |

---

## 4. RECOMMANDATIONS D'IMPLEMENTATION

### 4.1 Architecture recommandee

```
services/service-commission/src/
  modules/
    audit/                    # NOUVEAU - Audit trail complet
      audit.module.ts
      audit.service.ts
      entities/commission-audit-log.entity.ts
    
    engine/
      commission-engine.service.ts  # A ENRICHIR
        + calculateRecurrence()
        + calculateTeamBonus()
        + calculateRetrocession()
        + handleNegativeReport()
    
    export/                   # NOUVEAU - Generation PDF/Excel
      export.module.ts
      export.service.ts
      templates/
        bordereau-pdf.template.ts
        bordereau-excel.template.ts
    
    kpi/                      # NOUVEAU - Reporting
      kpi.module.ts
      kpi.service.ts
      entities/kpi-snapshot.entity.ts
    
    version/                  # NOUVEAU - Versionning baremes
      bareme-version.entity.ts
      bareme-version.service.ts
```

### 4.2 Priorites d'implementation

**Sprint 1 (2 semaines) - Fondations**
1. Module audit trail avec journalisation des calculs
2. Integration evenements contrats/encaissements (events ou polling)
3. Calcul commissions recurrentes

**Sprint 2 (2 semaines) - Exports et conformite**
1. Generation PDF bordereaux (pdfkit ou puppeteer)
2. Generation Excel bordereaux (exceljs)
3. Hash SHA-256 et archivage

**Sprint 3 (2 semaines) - Enrichissement moteur**
1. Reports negatifs multi-periodes
2. Profils manager/directeur et retrocessions
3. Versionning baremes avec historisation

**Sprint 4 (2 semaines) - Reporting**
1. Dashboard KPI commissions
2. Snapshots mensuels
3. Comparatifs et graphiques

### 4.3 Points de flexibilite a preserver

Pour garantir l'adaptabilite CRM multi-clients:

1. **Baremes 100% configurables** - Garder les champs texte libres (typeProduit, profilRemuneration, canalVente)
2. **Regles metier parametrables** - Externaliser les constantes (fenetres reprise, plafonds acomptes) en config
3. **Statuts dynamiques** - Table statuts_commission pour ajouter des etats sans code
4. **Multi-tenant natif** - Toujours filtrer par organisationId
5. **API ouverte** - Maintenir l'API gRPC complete pour integrations tierces
6. **Webhooks** - Ajouter un systeme d'evenements pour notifier les autres modules

---

## 5. CHECKLIST DE VALIDATION FINALE

Avant mise en production, verifier:

- [ ] Tous les types de calcul (fixe, %, palier, mixte, recurrence) sont testes
- [ ] Les reprises sont correctement calculees selon les fenetres par produit
- [ ] Les reports negatifs se propagent sur les periodes suivantes
- [ ] Les exports PDF/Excel sont identiques et signes (SHA-256)
- [ ] L'audit trail enregistre toutes les operations sensibles
- [ ] Les roles ADV/Direction/Partenaire ont les bons acces
- [ ] Le versionning des baremes empeche la modification retroactive
- [ ] Les KPI sont calcules et snapshotes mensuellement
- [ ] L'integration contrats/encaissements fonctionne en temps reel
- [ ] La conformite RGPD est respectee (retention, acces, anonymisation)

---

*Document genere automatiquement - A maintenir a jour avec chaque evolution du module*
