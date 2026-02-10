# Draft: Webhook Catalogue Produits (Sync Bidirectionnel)

## Requirements (confirmed)
- **Source**: Sync bidirectionnel — le CRM reçoit des produits ET envoie des produits vers l'outil du collègue
- **Comportement**: Sync catalogue (upsert) — créer ou mettre à jour les produits
- **Service cible**: À recommander (→ service-commercial, là où vivent déjà les produits)

## Research Findings

### Architecture découverte
- **Monorepo NestJS** avec 5 microservices hybrides (gRPC + HTTP)
- **service-commercial** (port 3053/50053): héberge Products, Contrats, WooCommerce, IMS webhooks
- **Pattern webhook établi**: HTTP Controller → Domain Service → Entity Inbox → NATS → Async Worker
- **3 implémentations de référence**: WooCommerce, IMS/Mondial-TV, Depanssur

### Entité ProduitEntity existante (service-commercial)
- 40+ champs : SKU, nom, description, categorie, type, prix, tauxTva, devise...
- Champs avancés: tarification (FIXE/PALIER/RECURRENT/USAGE/BUNDLE/NEGOCIE/INDEXE), comptabilité, partenaire
- Relations: Gamme, Version, Formule, PrixProduit, GrilleTarifaire

### JSON entrant du partenaire (structure)
```json
{
  "id": 1,                        // ID externe du partenaire
  "nom": "Forfait Illimité...",
  "description": "...",
  "categorie": "Téléphonie",     // Catégorie libre (pas enum interne)
  "fournisseur": "BLEUTEL",
  "logo_url": "/logo/...",
  "prix_base": 5.9,
  "features": [],
  "formules": null,
  "popular": true,
  "rating": 4.5,
  "isActive": true
}
```

### Décalage constaté JSON vs ProduitEntity
Le JSON partenaire est BEAUCOUP plus simple que ProduitEntity (10 champs vs 40+). Plusieurs champs n'ont pas de correspondance directe: `popular`, `rating`, `logo_url`, `fournisseur`, `features`, `formules`.

## Technical Decisions
- **Service recommandé**: service-commercial (produits + webhooks existants)
- **Pattern**: Suivre WooCommerce/IMS (inbox entity, HMAC, NATS async)

## Open Questions
- AUCUNE — toutes les questions ont été résolues

## Decisions (interview round 2 & 3)
- **Modèle de données**: Mapper vers ProduitEntity existant (pas d'entité séparée)
- **Champs manquants**: Ajouter des colonnes à ProduitEntity (popular, rating, logo_url, features, formules)
- **ID externe**: Utiliser le même ID entre les deux systèmes
- **Catégories**: Ajouter un champ categorie_partenaire en texte libre (en plus de l'enum interne)
- **Authentification**: API Key simple dans le header
- **Webhook sortant**: Automatique sur modif produit + bouton "Synchroniser" sur la page catalogue
- **Format sortant**: ProduitEntity complet (le partenaire prend ce qu'il veut)
- **URL sortante**: Fixe dans variable d'environnement
- **Sync manuelle**: Bouton sur la page catalogue produits, sync tous les produits actifs
- **Multi-tenant**: Oui, par organisation (URL webhook inclut org ID)

## Scope Boundaries
- INCLUDE: 
  - Webhook entrant (POST /webhooks/catalogue/:organisationId) — réception + upsert
  - Webhook sortant automatique (push sur modif produit)
  - Webhook sortant manuel (bouton "Synchroniser" page catalogue)
  - Migration DB (nouvelles colonnes ProduitEntity)
  - Webhook event inbox entity (pattern existant)
- EXCLUDE:
  - UI de configuration des webhooks sortants (URL fixe en env)
  - Retry/DLQ avancé (on suit le pattern basique existant)
  - Transformation complexe des données (mapping direct)
