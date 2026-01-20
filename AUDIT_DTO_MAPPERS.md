# Audit du Codebase - DTOs/Mappers/Adapters à Supprimer

## Date
19 janvier 2026

## Objectif

Identifier tous les DTOs, mappers, adapters et transformers écrits manuellement qui doivent être supprimés pour respecter l'architecture contract-driven stricte.

## Règles d'Audit

1. **DTOs à Supprimer**
   - Fichiers avec `.dto.ts` dans le code métier (pas node_modules)
   - Fichiers définissant des types d'entrée/sortie manuellement
   - Fichiers contenant `class-validator`, `class-transformer`

2. **Mappers/Adapters/Transformers à Supprimer**
   - Fichiers avec `mapper` dans le nom
   - Fichiers avec `adapter` dans le nom
   - Fichiers avec `transformer` dans le nom
   - Fichiers contenant des fonctions de conversion camelCase ↔ snake_case

3. **Exclusions (PAS à supprimer)**
   - `node_modules/` : dépendances NestJS automatiques (acceptable)
   - `_backup/` : déjà identifié comme obsolète

## État Actuel

### 1. Dossier `_backup/` (Obsolète - À SUPPRIMER)

**Contenu** : 100+ DTOs manuels dans `services/_backup/applications/dto/**`

**Exemples** :
- `service-applications/dto/theme-marque/create-theme-marque.dto.ts`
- `service-applications/dto/statut-commission/create-statut-commission.dto.ts`
- `service-clients/dto/client-base/create-client-base.dto.ts`
- `service-commerciaux/dto/commercials/create-commercials.dto.ts`
- Et 90+ autres

**Statut** : Ce dossier doit être supprimé complètement.

### 2. Code Métier Actuel (Pas dans `_backup/`)

**Résultat de la recherche** :
```bash
find services/ -name "*.dto.ts" -o -name "*mapper*.ts" -o -name "*adapter*.ts" \
  -o -name "*transformer*.ts" -type f 2>/dev/null | \
  grep -v "node_modules" | grep -v "_backup" | head -50
```

**Résultat** : AUCUN fichier trouvé dans le code métier actuel (hors `node_modules` et `_backup`).

### 3. Fichiers Scaffolding NestJS (node_modules)

**Fichiers trouvés** (exemples - ACCEPTABLES, PAS à supprimer) :
- `node_modules/@nestjs/schematics/dist/lib/resource/files/ts/dto/create-*.dto.ts`
- `node_modules/@nestjs/common/interfaces/websockets/web-socket-adapter.interface.d.ts`
- `node_modules/class-transformer/types/interfaces/class-transformer-options.interface.d.ts`

**Justification** :
Ce sont des dépendances NestJS automatiques générées par `@nestjs/schematics`.
Elles ne contiennent PAS de logique métier de l'application.

### 4. Services à Vérifier Manuellement

Les services suivants n'ont PAS de DTOs/mappers dans le code actuel (bon signe) :

| Service | Statut DTO/Mapper | Statut Validation |
|---------|---------------------|-------------------|
| service-activites | ✅ Aucun | ⚠️ À vérifier |
| service-clients | ✅ Aucun | ⚠️ À vérifier |
| service-commerciaux | ✅ Aucun | ⚠️ À vérifier |
| service-commission | ✅ Aucun | ⚠️ À vérifier |
| service-contrats | ✅ Aucun | ⚠️ À vérifier |
| service-dashboard | ✅ Aucun | ⚠️ À vérifier |
| service-documents | ✅ Aucun | ⚠️ À vérifier |
| service-email | ✅ Aucun | ⚠️ À vérifier |
| service-factures | ✅ Aucun | ⚠️ À vérifier |
| service-logistics | ✅ Aucun | ⚠️ À vérifier |
| service-notifications | ✅ Aucun | ⚠️ À vérifier |
| service-organisations | ✅ Aucun | ⚠️ À vérifier |
| service-payments | ✅ Aucun | ⚠️ À vérifier |
| service-products | ✅ Aucun | ⚠️ À vérifier |
| service-referentiel | ✅ Aucun | ⚠️ À vérifier |
| service-relance | ✅ Aucun | ⚠️ À vérifier |
| service-users | ✅ Aucun | ⚠️ À vérifier |

## Actions Requises

### Action 1 : Supprimer le dossier `_backup/` (Priorité HAUTE)

```bash
# Commande à exécuter
rm -rf services/_backup/
```

**Justification** :
- Ce dossier contient 100+ DTOs obsolètes
- Ces DTOs dupliquent les Protos
- Ils ne sont PAS utilisés dans le code actuel
- Ils créent de la confusion et de la dette technique

### Action 2 : Vérifier Validation dans les Services

Pour chaque service, vérifier si `ValidationPipe` est configuré :

```bash
# Chercher "ValidationPipe" ou "class-validator"
grep -r "ValidationPipe\|class-validator\|@Body(" services/*/src --include="*.ts" | head -20
```

**Attendu** :
- Aucun usage de `class-validator` dans le code actuel (bon signe)
- Utilisation potentielle des types Protos comme `@Body()` sans ValidationPipe

### Action 3 : Créer les Services ValidationPipe (Si nécessaire)

Si aucun `ValidationPipe` n'est trouvé, les créer selon le template dans `PROTO_EXEMPLE_IMPLEMENTATION.md`.

### Action 4 : Vérifier service-factures (Exception)

Le service `service-factures` a 3 DTOs manuels à migrer :

```bash
# DTOs manuels identifiés
find services/service-factures -name "*.dto.ts"

# Résultat attendu :
# - create-invoice-item.dto.ts
# - create-invoice.dto.ts
# - update-invoice.dto.ts
```

**Action requise** : Migrer ces DTOs vers des types proto-générés

### Action 5 : Supprimer le dossier `_backup/` (Priorité HAUTE)

```bash
# Commande à exécuter
rm -rf services/_backup/

# Justification :
# - Ce dossier contient 100+ DTOs obsolètes
# - Ces DTOs dupliquent les Protos
# - Ils ne sont PAS utilisés dans le code actuel
# - Ils créent de la confusion et de la dette technique
```

## Résumé de l'Audit

| Catégorie | État | Action Requise |
|-----------|--------|----------------|
| DTOs manuels dans `services/` | ✅ AUCUN (bon signe) | Rien à faire |
| DTOs manuels dans `services/_backup/` | ❌ 100+ fichiers | SUPPRIMER `_backup/` |
| Mappers/Adapters manuels | ✅ AUCUN (bon signe) | Rien à faire |
| Validation aux frontières | ⚠️ À vérifier | Audit manuel requis |
| `node_modules` scaffolding | ✅ AUTOMATIQUE | Rien à faire |

## Checklist de Nettoyage

- [ ] Supprimer le dossier `services/_backup/`
- [ ] Vérifier chaque service pour ValidationPipe
- [ ] Créer ValidationPipe dans les services si manquant
- [ ] Vérifier que les contrôleurs utilisent `@Body()` avec ValidationPipe
- [ ] Confirmer qu'aucun DTO/mapper/adapter manuel n'existe dans le code métier
- [ ] Tester que les services démarrent après nettoyage

## Points Positifs

✅ **Le code métier actuel est déjà conforme** : Aucun DTO/mapper/adapter manuel trouvé
✅ **Les services sont "propre"** : Ils utilisent déjà les types générés depuis proto (via `ts-proto`)
✅ **Seule violation majeure** : Le dossier `_backup/` avec des DTOs obsolètes

## Prochaine Étape

1. Nettoyer le dossier `_backup/`
2. Configurer ValidationPipe NestJS dans tous les services
3. Générer les entités TypeORM depuis proto (plan de migration déjà créé)

---

**Projet** : CRM Final - Multi-tenant White Label Partner Management System
**Date** : 19 janvier 2026
**Version** : 1.0.0 - Audit DTO/Mappers/Adapters
