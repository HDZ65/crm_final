# Draft: Implémentation CDC Catalogue Produits & Partenaires

## Requirements (confirmed)
- **Scope**: Implémenter TOUT ce qui manque du cahier des charges "Module Catalogue Produits & Partenaires"
- **Approche**: Un seul plan exhaustif, tout d'un coup, organisé en vagues logiques
- **Intégrations**: OUI — OggoData/APIMarket à connecter réellement
- **Tests**: Tests après implémentation (pas TDD)
- **Architecture existante**: Microservices NestJS DDD + gRPC + NATS + TypeORM + Next.js frontend

## Analyse des écarts identifiés

### 🔴 MANQUANT COMPLÈTEMENT
1. **Entité Partenaire/Compagnie enrichie** — Type, IBAN, API credentials, SLA, activation par société
2. **Formules/Plans (Formula)** — Sous-produit avec garanties, options, franchises
3. **Modèles tarifaires avancés** — Palier, récurrent, usage, bundle, négocié, indexé
4. **Intégration OggoData/APIMarket** — Consultation tarifaire, sync fiches, webhooks
5. **Webhooks produit** — Statuts envoyé/confirmé/échoué/rejoué
6. **Mapping comptable produit** — code_comptable, compte_produit, journal_vente, exports
7. **Catalogue agrégé publishable** — Entité Catalogue avec état Brouillon/Publié/Archivé
8. **Canaux de vente** — Segmentation Terrain/Téléphone/Web/MarqueBlanche/Marketplace
9. **DIPA dynamique** — Génération par canal/produit
10. **RACI/Conformité** — Documents légaux par canal

### ⚠️ À ENRICHIR
1. **SocieteEntity** — Ajouter logo, devise, paramètres comptables, ICS, adresses
2. **GammeEntity** — Ajouter hiérarchie parent-enfant (taxonomie Risque > Famille)
3. **ModeleDistributionEntity** — Ajouter liens Partenaire/Société, règles partage, taux
4. **ProduitEntity** — Ajouter champs contractuels et comptables
5. **ContratEntity** — Ajouter FK partenaireId, canalVente
6. **Audit trail** — Ajouter created_by/modified_by sur toutes les entités

### ✅ DÉJÀ IMPLÉMENTÉ
- Produits CRUD complet (entity + proto + controller + frontend)
- Gammes, Grilles tarifaires, Prix produit
- Versioning produit avec dates d'effet
- Documents produit (DIPA, CG, CP, TARIF, SCRIPT, MEDIA)
- Publications par société avec visibilité et channels
- Cycle de vie produit (Brouillon → Test → Actif → Gelé → Retiré)
- Promotions avec dates
- Commissions complètes (barèmes, paliers, récurrence, reprises)
- Multi-société
- Contrats avec lignes
- Frontend catalogue complet

## Technical Decisions
- **Service cible principal**: service-commercial (Products bounded context) + service-core (Organisations)
- **Pattern**: DDD existant (domain/application/infrastructure/interfaces)
- **DB**: PostgreSQL via TypeORM migrations
- **API**: gRPC (proto definitions dans packages/proto)
- **Events**: NATS pour webhooks/événements produit
- **Frontend**: Next.js App Router + Shadcn components

## Open Questions
- Aucune — toutes les questions clés ont été répondues

## Scope Boundaries
- INCLUDE: Toutes les lacunes identifiées ci-dessus
- INCLUDE: Intégrations OggoData/APIMarket réelles
- INCLUDE: Tests après implémentation
- EXCLUDE: Refactoring du code existant qui fonctionne déjà
- EXCLUDE: Modules hors CDC (Paiements SEPA, etc. — autres CDC)
