# Analyse des écarts — CDC Paiements (SEPA & CB) vs CRM existant

## Date: 2026-02-07

## Sources
- **CDC Paiements**: `docs/EXTRACTED_PAIEMENTS.txt` (2213 lignes, 10 sections + 17 annexes A→U)
- **Codebase**: service-finance (NestJS, gRPC, TypeORM/PostgreSQL, DDD)
- **Proto**: `packages/proto/src/payments/payment.proto` (897 lignes)

## Architecture existante (confirmé par exploration)
- **Backend**: NestJS 11, gRPC, TypeORM/PostgreSQL, DDD (3 bounded contexts : Payments, Factures, Calendar)
- **Frontend**: Next.js 15.5, React 19, Shadcn UI
- **Proto**: ~70 RPC methods dans payment.proto (Stripe, PayPal, GoCardless, Schedule, PaymentIntent, PaymentEvent, Portal)
- **Entités Payments (21)**: Schedule, PaymentIntent, PaymentEvent, PaymentAuditLog, Portal(2), PSP Accounts(6), GoCardlessMandate, RetryPolicy, RetrySchedule, RetryJob, RetryAttempt, ReminderPolicy, Reminder, RetryAuditLog, PSPEventInbox
- **Entités Calendar (11)**: SystemDebitConfig, CutoffConfig, CompanyDebitConfig, ClientDebitConfig, ContractDebitConfig, HolidayZone, Holiday, PlannedDebit, VolumeForecast, VolumeThreshold, CalendarAuditLog

---

## ANALYSE PAR SECTION DU CDC

### SECTION 1 — Présentation & Objectifs
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Centraliser paiements SEPA + CB | ✅ OUI | Service unifié service-finance |
| Connecter PSP (Slimpay, MSP, EMP, GoCardless) | ✅ Partiel | **Slimpay: entité account OK, API non implémentée** |
| | | **MultiSafepay: entité account OK, API non implémentée** |
| | | **Emerchantpay: entité account OK, API non implémentée** |
| | | GoCardless: ✅ entité + API gRPC complet |
| | | Stripe: ✅ complet (non dans CDC mais ajouté) |
| | | PayPal: ✅ complet (non dans CDC mais ajouté) |
| Routage dynamique fournisseurs | ❌ NON | **MAJEUR — Aucune table routing_rules, aucun moteur** |
| Conformité SEPA/DSP2/RGPD/PCI-DSS | Partiel | Framework OK, implémentation spécifique manquante |
| >10 000 transactions/jour | Non testé | Infrastructure OK, benchmarks manquants |
| RBAC multi-profil (ADV/Compta/Finance/IT) | Partiel | Rôles CRM hérités, granularité paiements ? |

### SECTION 2 — Architecture fonctionnelle
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Calendar Engine (planned_debit_date) | ✅ OUI | PlannedDebitEntity avec date, batch, config résolu |
| Config hiérarchique (System→Company→Client→Contract) | ✅ OUI | 4 niveaux d'entités de config |
| Gestion jours fériés | ✅ OUI | HolidayZone + Holiday entities |
| Lots L1-L4 (batch weekly) | ✅ Partiel | DebitBatch enum existe, mapping jour→lot ? |
| Cutoff horaire | ✅ OUI | CutoffConfigurationEntity |
| RUM automatique {ICS}-{ContractID}-{YYYY} | ✅ Partiel | GoCardlessMandateEntity a `rum` (unique, 35 chars), mais **RUMGeneratorService non trouvé** |
| Mandats SEPA (IBAN/BIC chiffrés) | Partiel | GoCardless gère via API, **pas de stockage IBAN/BIC direct chiffré** |
| Moteur de scoring (IA) | ❌ NON | **Aucune table risk_scores, aucun service** |

### SECTION 3 — Fonctionnalités principales
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| **3.1 Émission planifiée** | | |
| Job quotidien 02:00 émission auto | ❓ Non vérifié | ProcessDuePayments RPC existe, mais job cron ? |
| Respect cutoff horaire | ✅ | CutoffConfiguration existe |
| Émission manuelle ADV | ✅ Partiel | RPC existe, UI partielle |
| Export SEPA XML / CSV | ❌ NON | **MAJEUR — Aucune génération fichier SEPA** |
| **3.2 Réémission AM04** | | |
| Retry auto J+5/J+10/J+20 | ✅ OUI | RetryPolicyEntity très complet (retryDelaysDays, maxAttempts, retryableCodes, backoffStrategy) |
| Retry par code erreur (AM04) | ✅ OUI | retryOnAm04, retryableCodes, nonRetryableCodes |
| Stop conditions (mandat révoqué, contrat annulé) | ✅ OUI | stopOnPaymentSettled, stopOnContractCancelled, stopOnMandateRevoked |
| Alerte REJECT_SPIKES (>20%) | ❌ NON | **Pas de système d'alertes** |
| **3.3 Suivi et reporting** | | |
| Tableau ADV (badges couleur, filtres) | ✅ Partiel | payment-table.tsx, payment-filters.tsx, payment-kpi-cards.tsx |
| Vue Comptabilité (exports, rapprochement CAMT.053) | ❌ NON | **MAJEUR — Aucun rapprochement bancaire** |
| Vue Direction Financière | ❌ NON | **Pas de tableau global Finance** |
| KPI (montants émis/payés/rejetés, taux rejet) | ✅ Basique | payment-kpi-cards.tsx, mais limité |
| **3.4 Archivage automatique** | | |
| Auto-archivage J+30 statuts finaux | ❌ NON | **Aucun job d'archivage, pas de table payments_archive** |
| Lecture seule paiements archivés | ❌ NON | |
| Partitionnement mensuel (>5M/an) | ❌ NON | Pas de partitionnement |
| Export asynchrone (lien signé 24h) | ❌ NON | **Pas de table export_jobs** |
| **3.5 Calendar Engine** | | |
| preferred_debit_day (1-28) | ❓ | Champ dans config entities ? |
| debit_lot_code (L1-L4) | ✅ Partiel | DebitBatch enum dans system-debit-config |
| debit_calendar JSON (company_settings) | ❓ | CompanyDebitConfig existe, structure exacte ? |
| Heatmap volumes par jour | ❌ NON | **Pas de composant frontend** |
| Import CSV assignation masse jour/lot | ❌ NON | |

### SECTION 4 — Routage dynamique fournisseurs
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Table provider_routing_rules | ❌ NON | **BLOQUANT — Table entièrement manquante** |
| Conditions JSONB (jour, lot, canal, scoring, produit) | ❌ NON | |
| Moteur évaluation priorité | ❌ NON | |
| Fallback rule | ❌ NON | |
| Provider overrides (client/contrat) | ❌ NON | **Table provider_overrides manquante** |
| Réaffectation par lot (provider_reassignment_jobs) | ❌ NON | **Table manquante** |
| Dry-run / simulation | ❌ NON | |
| Rollback migration | ❌ NON | |
| Interface Direction Financière | ❌ NON | **Aucune UI routage** |
| Testeur de règle | ❌ NON | |

### SECTION 5 — Supervision & alertes
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Table alerts (severity, code, channels) | ❌ NON | **Table manquante** |
| Alertes PROVIDER_ROUTING_NOT_FOUND | ❌ NON | |
| Alertes API_CREDENTIALS_INVALID | ❌ NON | |
| Alertes REJECT_SPIKES | ❌ NON | |
| Alertes BATCH_DAY_EMPTY | ❌ NON | |
| Alertes CUTOFF_MISSED | ❌ NON | |
| Alertes HIGH_RISK_MISROUTED | ❌ NON | |
| Multi-canal (email, Slack, UI bannière) | ❌ NON | |
| Acquittement alertes | ❌ NON | |
| Prometheus/Grafana dashboards | ❌ NON | **Pas de métriques Prometheus** |
| VolumeThreshold alerts | ✅ Partiel | alertOnExceed, alertEmail sur VolumeThresholdEntity |

### SECTION 6 — Sécurité & conformité
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| AES-256 IBAN/BIC | ❌ NON | **Pas de chiffrement applicatif** |
| TLS 1.3 | ✅ | Infra niveau |
| Masquage IBAN logs/exports | ❌ NON | |
| Rotation clés API 90 jours | ❌ NON | |
| SSO Microsoft 365 | ❓ | CRM-level |
| MFA | ❓ | CRM-level |
| RBAC spécifique paiements | ❌ Partiel | |
| HMAC webhooks PSP | ✅ Partiel | PSPEventInbox + proto HMAC |
| Anti-replay 5 min | ❓ | Non vérifié |
| Politique rétention (24m bancaires, 10 ans exports) | ❌ NON | **Aucune politique de rétention** |

### SECTION 7 — UX/UI & performance
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| **6 écrans majeurs** | | |
| 1. Émission planifiée (calendrier) | ❌ NON | **Pas de vue calendrier heatmap** |
| 2. Suivi des paiements (opérationnel) | ✅ Partiel | payment-table.tsx existe |
| 3. Reporting & KPI | ✅ Basique | payment-kpi-cards.tsx |
| 4. Paiements archivés | ❌ NON | **Pas d'écran archivés** |
| 5. Routage Finance | ❌ NON | **Pas d'écran routage** |
| 6. Scoring & relances | ❌ NON | **Pas d'écran scoring** |
| WebSocket statuts temps réel | ❌ NON | |
| Virtual scroll (>10k lignes) | ❌ NON | |
| Pagination serveur | ✅ Partiel | gRPC pagination exists |
| Thème clair/sombre | ❓ | Frontend CRM level |

### SECTION 8 — Monitoring & SLA
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Prometheus métriques | ❌ NON | |
| Grafana dashboards (IT/Finance/Direction) | ❌ NON | |
| Alertmanager | ❌ NON | |
| Job Tracker interne | ❌ NON | |
| SLA <5 min statuts, <3s latence, 99.9% | Non mesuré | |

### SECTION 9 — Tests & validation
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Tests fonctionnels (émission, retry, routage) | ❌ NON | **Aucun test** |
| Tests charge (10k paiements, 100 webhooks/s) | ❌ NON | |
| Tests sécurité (HMAC, RBAC) | ❌ NON | |
| Tests scoring prédictif | ❌ NON | |
| Tests calendrier (bissextile, fériés) | ❌ NON | |

### SECTION 10 — Livrables attendus
| Livrable CDC | Implémenté | Écart |
|---|---|---|
| Calendar Engine | ✅ OUI | Domain Calendar complet |
| Batch Scheduler | ❓ Partiel | ProcessDuePayments RPC |
| Retry Scheduler | ✅ OUI | RetryPolicy/Schedule/Job/Attempt |
| Archive Scheduler | ❌ NON | |
| Risk Scoring Engine (IA) | ❌ NON | **Entièrement manquant** |
| Reminder Engine | ✅ OUI | ReminderPolicy + Reminder entities |
| Payment Portal Engine | ✅ OUI | PortalPaymentSession + API gRPC |
| Routing Rules Engine | ❌ NON | **Entièrement manquant** |
| Documentation technique | ❌ Partiel | CLAUDE.md existe |

---

## ANALYSE DES ANNEXES CDC

### Annexe A — Schéma de données
| Table CDC | Existe dans CRM | Écart |
|---|---|---|
| companies (+ debit_calendar jsonb) | Autre service | debit_calendar dans CompanyDebitConfig |
| customers (+ preferred_debit_day) | Autre service | Champ à vérifier |
| contracts (+ preferred_debit_day, debit_lot_code, mandate_id) | Autre service | Champs à vérifier |
| payments (+ planned_debit_date) | ✅ PaymentIntentEntity | Mais structure différente (pas planned_debit_date interne, via PlannedDebit) |
| payment_logs | ✅ PaymentEventEntity | OK, 15 event types |
| webhook_events | ✅ PSPEventInboxEntity | OK |
| retry_policies | ✅ RetryPolicyEntity | Très complet |
| provider_routing_rules | ❌ NON | **MANQUANT** |
| alerts | ❌ NON | **MANQUANT** |
| export_jobs | ❌ NON | **MANQUANT** |
| **risk_scores** | ❌ NON | **MANQUANT** |
| **customer_interactions** | ❌ NON | **MANQUANT** (Reminder entity != customer_interactions CDC) |
| **payment_portal_sessions** | ✅ PortalPaymentSessionEntity | OK, très complet |
| payment_statuses (référentiel) | ❌ NON | Statuts en enum, pas de table référentiel |
| provider_status_mapping | ❌ NON | **MANQUANT — mapping PSP→interne** |
| sepa_mandates | ✅ Partiel | GoCardlessMandateEntity mais **spécifique GoCardless** |
| provider_overrides | ❌ NON | **MANQUANT** |
| provider_reassignment_jobs | ❌ NON | **MANQUANT** |
| rejection_reasons (Annexe P) | ❌ NON | **MANQUANT** |

### Annexe B — Réémission AM04
| Exigence | Implémenté | Écart |
|---|---|---|
| Policy J+5/J+10/J+20 | ✅ OUI | retryDelaysDays: [5,10,20] |
| Conditions (contrat actif, mandat actif, retry_count) | ✅ OUI | stopOn* conditions |
| Recadrage sur prochain lot | ❌ NON | Pas d'intégration calendrier→retry |
| Scoring override (suspend/force) | ❌ NON | |

### Annexe C — Routage fournisseurs
Entièrement absent (cf. Section 4 ci-dessus).

### Annexe D — Webhooks PSP
| Exigence | Implémenté | Écart |
|---|---|---|
| Endpoints par PSP (/webhooks/{psp}/{company_id}) | ❓ Partiel | PSPEventInbox existe |
| HMAC SHA-256 | ❓ | |
| Anti-replay 5 min | ❓ | |
| Idempotence (provider_event_id) | ✅ | providerEventId dans PaymentEventEntity |
| Mapping statuts (Annexe K) | ❌ NON | **Pas de table provider_status_mapping** |
| Événements portail (portal.*) | ✅ | Portal proto messages |
| Événements système (system.*) | ❌ NON | |

### Annexe J — Exports comptables
Entièrement absent (cf. Section 3.3 ci-dessus).

### Annexe K — Mapping statuts fournisseurs
| PSP | Implémenté | Écart |
|---|---|---|
| Slimpay mapping | ❌ NON | |
| MultiSafepay mapping | ❌ NON | |
| Emerchantpay mapping | ❌ NON | |
| GoCardless mapping | ❓ Partiel | Webhooks gRPC existe |

### Annexe L — Politique RUM
| Exigence | Implémenté | Écart |
|---|---|---|
| Format {ICS}-{ContractID}-{YYYY} | ❓ | GoCardless mandate a `rum` unique 35chars |
| RUMGeneratorService | ❌ NON | **Service manquant** |
| Multi-contrats / RUM partagé | ❌ NON | |
| Hash SHA-256 du RUM | ❌ NON | |

### Annexe N — Rapprochement bancaire
Entièrement absent. Aucune fonctionnalité de réconciliation CAMT.053.

### Annexe O — Calendrier prélèvements & Lots
Partiellement implémenté via le bounded context Calendar (11 entités).
Manquant : UX heatmap, import CSV, algorithme compute_planned_date complet.

### Annexe P — Référentiel motifs de rejet
| Table rejection_reasons | ❌ NON | **MANQUANT** |

### Annexe Q — Portail client
✅ BIEN implémenté (PortalPaymentSession, Portal proto, frontend components).

---

## RÉSUMÉ DES ÉCARTS

### 🔴 BLOQUANTS (fonctionnalités cœur absentes)

1. **Routage dynamique fournisseurs** — Aucune table, aucun moteur, aucune UI
   - Tables manquantes: provider_routing_rules, provider_overrides, provider_reassignment_jobs
   - Pas de moteur d'évaluation des règles
   - Pas d'UI Direction Financière

2. **Connecteurs PSP Slimpay / MultiSafepay / Emerchantpay** — Entités OK mais API non implémentées
   - Seuls GoCardless, Stripe et PayPal ont des RPCs
   - Slimpay: 0 RPC (CDC l'exige comme PSP principal SEPA)
   - MultiSafepay: 0 RPC (CDC l'exige pour CB)
   - Emerchantpay: 0 RPC (CDC l'exige pour SEPA & CB)

3. **Rapprochement bancaire (CAMT.053)** — Entièrement absent
   - Pas d'import relevés bancaires
   - Pas d'appariement automatique
   - Pas de statuts réconciliation
   - Pas d'UI comptabilité

4. **Exports comptables** — Entièrement absent
   - Pas de table export_jobs
   - Pas de génération CSV/XLSX/JSON
   - Pas de lien signé 24h
   - Pas d'envoi SFTP cabinet

5. **Système d'alertes** — Entièrement absent
   - Pas de table alerts
   - Pas de notifications multi-canal
   - Pas d'acquittement
   - Aucune des 9 alertes du CDC

6. **Scoring prédictif (Risk Engine)** — Entièrement absent
   - Pas de table risk_scores
   - Pas de moteur IA
   - Pas de risk_tier
   - Pas d'arbitrage scoring→routage

### 🟠 IMPORTANTS (fonctionnalités significatives manquantes)

7. **Mapping statuts fournisseurs** (provider_status_mapping)
8. **Référentiel motifs de rejet** (rejection_reasons)
9. **Table payment_statuses référentiel** (vs enums codés en dur)
10. **Archivage automatique** (job, table archive, lecture seule)
11. **Export SEPA XML** (pain.008) pour banques
12. **Customer interactions** (table CDC != Reminder entity)
13. **Chiffrement AES-256 IBAN/BIC** applicatif
14. **Masquage IBAN** dans logs/exports
15. **RUMGeneratorService** (génération format {ICS}-{ContractID}-{YYYY})
16. **UX Finance** (calendrier heatmap, routage, scoring)
17. **Prometheus/Grafana** métriques et dashboards
18. **WebSocket** statuts temps réel

### 🟡 MINEURS / OPTIONNELS

19. Virtual scroll (>10k lignes)
20. Import CSV assignation masse jours/lots
21. Tests automatisés
22. PRA/PCA formalisé
23. Documentation technique complète
24. Politique rétention données (24m/10 ans)

### ✅ BIEN IMPLÉMENTÉ

1. **Calendar Engine** — 11 entités, config hiérarchique 4 niveaux, jours fériés
2. **Retry/Réémission** — Policies très complètes, 6 entités, codes erreur SEPA
3. **Reminders/Relances** — Policy + Reminder entities, multi-canal (EMAIL/SMS/PHONE/PUSH/POSTAL)
4. **Portail client** — Session tokens, audit, proto complet, frontend
5. **GoCardless/Stripe/PayPal** — Intégrations gRPC complètes
6. **PSP Accounts** — 6 providers avec entités dédiées
7. **Payment Events** — 15 types d'événements, audit log
8. **PlannedDebit** — Prélèvements planifiés avec batch, config résolu
9. **Webhook Inbox** — PSPEventInbox pour idempotence
10. **Frontend basique** — Tables, filtres, KPI cards, formulaires, détails

---

## SCORE GLOBAL DE COUVERTURE

| Domaine CDC | Couverture estimée | Détail |
|---|---|---|
| Calendar Engine | 80% | Modèle complet, UX manquante |
| Retry/Réémission | 90% | Très complet, manque intégration calendrier |
| Portail client | 85% | Modèle+API complets, frontend partiel |
| Reminders/Relances | 75% | Modèle OK, table customer_interactions manquante |
| PSP GoCardless | 90% | API gRPC complète |
| PSP Stripe/PayPal | 90% | Complet (bonus, pas dans CDC) |
| PSP Slimpay | 15% | Entité account seulement |
| PSP MultiSafepay | 15% | Entité account seulement |
| PSP Emerchantpay | 15% | Entité account seulement |
| Routage fournisseurs | 0% | Entièrement absent |
| Scoring/Risk Engine | 0% | Entièrement absent |
| Rapprochement bancaire | 0% | Entièrement absent |
| Exports comptables | 0% | Entièrement absent |
| Système d'alertes | 5% | VolumeThreshold seulement |
| Monitoring Prometheus/Grafana | 0% | Absent |
| Mapping statuts PSP | 0% | Absent |
| Archivage automatique | 0% | Absent |
| Sécurité (AES, masquage) | 20% | TLS OK, AES/masquage manquants |
| UX complète (6 écrans) | 30% | 1-2 écrans basiques sur 6 requis |
| Tests | 0% | Aucun test |

**Couverture globale estimée : ~35-40%**

Le CRM a un socle solide (Calendar, Retry, Portal, GoCardless) mais il manque environ 60% des fonctionnalités du CDC, principalement :
- Toute la couche routage/scoring/alertes
- 3 connecteurs PSP sur 4 requis
- Rapprochement bancaire et exports comptables
- La majorité des écrans UI
