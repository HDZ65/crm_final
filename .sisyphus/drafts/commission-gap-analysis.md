# Draft: Analyse des écarts — Cahier des charges Commission vs CRM existant

## Date: 2026-02-07

## Source
- **Cahier des charges**: `docs/Cahier des charges – Module Commission.docx` (1646 lignes, 13 sections + 7 annexes)
- **Codebase**: service-commercial (backend NestJS/gRPC) + frontend Next.js 15

## Architecture existante (confirmé par exploration)
- Backend: NestJS 11, gRPC, TypeORM/PostgreSQL, DDD
- Frontend: Next.js 15.5, React 19, Shadcn UI
- Proto: 40+ RPC methods dans commission.proto
- Entités: Commission, Bareme, Palier, Bordereau, LigneBordereau, Reprise, CommissionRecurrente, AuditLog, StatutCommission

## Analyse des écarts par section du CDC

### SECTION 3 — Profils de rémunération
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| VRP: commission fixe + % + bonus volume + primes produits cumulables | Partiel (fixe/%) | Bonus volume, primes produits cumulables MANQUANTS |
| Managers: fixe 2000€ + primes équipe par palier + rétrocessions | Partiel | Primes d'équipe, rétrocessions NON implémentées |
| Directeurs: fixe 3000€ + % commissions conseillers (8/10/12%) + récurrence santé 1% | Partiel | % sur commissions conseillers, multi-niveaux MANQUANT |
| Partenaires: paiement uniquement sur encaissé | Partiel | Condition "sur encaissé uniquement" non visible |
| Table `retrocessions` | NON | Table absente de la BDD |
| Table `equipes` / `rattachements` | À vérifier | Historique rattachements potentiellement manquant |

### SECTION 4 — Moteur de calcul
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| 3 bases de calcul (cotisation_ht, %_ca, forfait) | OUI | ✅ |
| 4 types de calcul (fixe, %, palier, mixte) | OUI | ✅ mais logique basique |
| Déclencheurs automatiques (CQ, encaissement, avenant, résiliation) | Partiel | Event-driven pas visible |
| Formule reprise: min(Σ versées sur fenêtre, due période) | NON | Formule non implémentée |
| Acomptes plafonnés 50% net | Partiel | Entité existe, plafonnement non visible |
| Reports négatifs inter-périodes | Partiel | Entité existe, logique d'apurement non visible |
| Combinaison bases (forfait + % CA) | NON visible | Calcul MIXTE simplifié |
| Récurrence: stop auto sur résiliation/défaut | Partiel | Entité existe, auto-stop non visible |
| Régularisation positive si impayé soldé | NON visible | Auto-création ligne positive manquante |

### SECTION 5 — Statuts et événements
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Statuts commission: en_attente, validée, reprise, payée, contestée | Partiel | **"Contestée" MANQUANT** |
| Statuts paiement: préparé, transmis, en_cours, réglé, échec | NON | Phase 2 mais champs absents |
| Statuts échéances: à_venir, échue, réglée, défaut | À vérifier | Potentiellement dans service-finance |
| Workflow contestation (2 mois, notification ADV, validation/rejet) | NON | Entièrement MANQUANT |

### SECTION 6 — Processus métier (8 étapes)
| Étape | Implémenté | Écart |
|---|---|---|
| 1. Contrat validé CQ | Partiel | Dépend intégration CQ |
| 2. Application schéma | OUI | Via CalculerCommission RPC |
| 3. Calcul commissions | OUI (basique) | Logique avancée manquante |
| 4. Vérification reprises | Partiel | Auto-check non visible |
| 5. Validation ADV + bordereau | Partiel | **Interface ADV incomplète** |
| 6. Export PDF/Excel | **NON** | **URLs stockées mais génération NON implémentée** |
| 7. Historisation/archivage | Partiel | Audit log OK, archivage bordereau incomplet |
| 8. Notification/diffusion | **NON** | **Aucune notification implémentée** |

### SECTION 7 — Validation ADV & Bordereaux
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Interface cases à cocher, filtres, recherche | Partiel | Champs is_selected existent, UI complète ? |
| Présélection automatique (validé + encaissé + à_payer) | NON visible | Auto-sélection non implémentée |
| Motif obligatoire sur désélection | NON visible | Champ motif absent sur ligne_bordereau |
| Recalcul dynamique totaux (Brut/Reprises/Net/Reports) | Partiel | Frontend basique |
| Validation finale + verrouillage + horodatage | Partiel | ValidateBordereau RPC existe |
| Hash SHA-256 du bordereau | NON | Champ hash existe en BDD mais calcul non implémenté |
| Verrous antidoublons | NON visible | Pas de vérification doublon |

### SECTION 8 — Exports et intégrations
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Génération PDF bordereau | **NON** | **MAJEUR — non implémenté** |
| Génération Excel bordereau | **NON** | **MAJEUR — non implémenté** |
| Transmission RWIN RH (API/SFTP) | NON | Phase ultérieure |
| Mapping JSON standard | Partiel | Proto types existent |
| Sync bidirectionnelle CRM ↔ commissions | Partiel | gRPC OK, events ? |

### SECTION 9 — Reporting & KPIs
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Tableaux de bord dynamiques | **NON** | **MAJEUR — aucun dashboard** |
| KPIs (brut, net, récurrence, taux reprise, production équipe) | NON | Table snapshots_kpi existe, calculs non implémentés |
| Comparatifs (période, produit, apporteur, direction) | NON | Non implémenté |
| Snapshots mensuels | Partiel | Table existe, alimentation automatique non visible |
| Export analytique (Excel/CSV) | NON | Non implémenté |

### SECTION 10 — Sécurité & Conformité
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| RBAC (ADV, Compta, Direction, Partenaire) | Partiel | Rôles CRM hérités, granularité commission ? |
| Audit trail complet | OUI | ✅ commission_audit_logs |
| RGPD (minimisation, 5 ans, pseudonymisation) | Partiel | Politiques de rétention non visibles |
| Hash SHA-256 fichiers | NON | Calcul non implémenté |
| Chiffrement AES-256 repos | À vérifier | Dépend infra PostgreSQL |
| HMAC API | NON | Non implémenté |

### SECTION 11 — Architecture technique
| Table CDC | Existe | Écart |
|---|---|---|
| apporteurs | OUI | ✅ |
| equipes | À vérifier | Potentiellement manquante |
| rattachements (historique) | À vérifier | Potentiellement manquante |
| contrats | Autre service | OK (service séparé) |
| echeances | Autre service | OK (service-finance ?) |
| schemas_commission | OUI (baremes_commission) | ✅ |
| baremes_versions (immuable JSON) | **NON séparée** | Versioning dans même table, pas de table séparée immuable |
| primes_palier | OUI (paliers_commission) | ✅ |
| retrocessions | **NON** | **Table MANQUANTE** |
| commissions_calculees | OUI (commissions) | ✅ |
| bordereaux | OUI | ✅ |
| bordereaux_lignes | OUI | ✅ |
| acomptes (table séparée) | **NON** | **Champs dans commission, pas de table dédiée** |
| reprises | OUI | ✅ |
| snapshots_kpi | OUI | ✅ |
| audit_log | OUI | ✅ |

### SECTION 12 — UX & Ergonomie
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Fiche commission (vue détaillée) | OUI | commission-detail-dialog ✅ |
| Bordereau (liste + totaux + cases à cocher) | Partiel | Interface complète manquante |
| Historique / archivage | Partiel | Page dédiée ? |
| Espace gestion barèmes (back-office) | Partiel | commission-config-dialog, completeness ? |
| Codes couleurs et icônes d'état | Partiel | Basique |
| Navigation latérale (Fiche, Bordereaux, Historique, Espace gestion) | NON | Page unique commissions |

### SECTION 13 — Tests
| Exigence CDC | Implémenté | Écart |
|---|---|---|
| Tests unitaires calcul | **NON** | **Aucun test trouvé** |
| Tests fonctionnels workflow | **NON** | Aucun test |
| Tests performance (100k contrats < 60s) | **NON** | Aucun benchmark |
| Tests sécurité | **NON** | Aucun test |

## Résumé des écarts CRITIQUES

### 🔴 BLOQUANTS (fonctionnalité cœur manquante)
1. **Génération PDF/Excel des bordereaux** — fonctionnalité centrale du module
2. **Interface ADV complète** — validation avec cases à cocher, motifs, totaux dynamiques
3. **Moteur de calcul avancé** — formules reprises, récurrence auto, régularisations
4. **Système de contestation** — statut "contestée" + workflow complet
5. **Reporting/Dashboards** — aucun tableau de bord KPI

### 🟠 IMPORTANTS (fonctionnalités significatives)
6. **Table rétrocessions** — multi-niveaux manager→directeur
7. **Table baremes_versions** — versioning immuable séparé
8. **Table acomptes** — gestion dédiée des avances
9. **Primes d'équipe & bonus volume** — logique par profil
10. **Notifications** — email/CRM après validation bordereau
11. **Hash SHA-256** — intégrité des bordereaux
12. **Présélection automatique** — lignes éligibles auto-cochées

### 🟡 MINEURS / PHASE 2
13. Transmission RWIN RH (API/SFTP)
14. Extranet partenaires
15. Export analytique programmable
16. Tests automatisés complets
17. HMAC API / chiffrement AES-256
