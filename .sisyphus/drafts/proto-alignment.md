# Draft: Alignement Proto avec winaity-clean

## Contexte
L'utilisateur veut aligner son projet crm_final sur les patterns proto de winaity-clean.

## Découvertes

### État actuel de crm_final
- **34 fichiers .proto** déjà présents dans `packages/proto/src/`
- **buf v2** configuré (plus récent que winaity-clean qui utilise v1)
- **Dual génération** : backend NestJS + frontend Next.js
- **Services gRPC** : 5 services avec microservices NestJS

### Domaines proto existants
- clients, users, organisations, documents
- factures, payments, calendar, contrats
- products, commerciaux, logistics, activites
- events (5 fichiers d'événements)
- security (auth, audit, crypto, errors)
- common (health, mcp)

### Gaps identifiés
1. **Services RPC non définis dans .proto** - Seulement messages, pas de `service X { rpc Y() }`
2. **Pas de gRPC Web** - Frontend utilise REST au lieu de gRPC
3. **Validation externe** - Dans NestJS, pas dans proto
4. **Documentation absente** - Pas de commentaires dans les .proto

## Questions ouvertes
- Quel est l'objectif exact ? Ajouter de nouveaux protos ? Améliorer l'existant ?
- Faut-il ajouter les définitions de services RPC aux .proto existants ?
- Le support gRPC Web est-il nécessaire ?

## Décisions
(En attente des réponses utilisateur)
