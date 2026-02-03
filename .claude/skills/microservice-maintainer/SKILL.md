---
name: microservice-maintainer
description: |
  Implémente les changements sur un microservice existant : AJOUTER features (command, query, event, champ), MODIFIER code (bugfix, refactor, perf), SUPPRIMER/deprecate. Analyse le service, génère les diffs, applique les changements, valide. Use when: "ajouter une commande", "nouveau champ", "modifier", "fix", "refactor", "supprimer", "deprecate", "cleanup", ou tout changement sur un service existant.
---

# Microservice Maintainer

Implémente les changements sur les microservices existants. Analyse, génère, applique, valide.

## Références

- **Templates** : [templates/](references/templates/) - Command, Query, Event, Migration
- **Patterns** : [patterns/](references/patterns/) - Add, Modify, Remove
- **Compat** : [compatibility-proto.md](references/compatibility-proto.md), [compatibility-events.md](references/compatibility-events.md), [compatibility-db.md](references/compatibility-db.md)
- **DDD** : [winaity-ddd-conventions.md](references/winaity-ddd-conventions.md)

## Workflow

### Phase 0: Clarifier

1. **Service cible** : Quel microservice modifier ?
2. **Type** : Ajouter / Modifier / Supprimer ?
3. **Description** : Que faire exactement ?

### Phase 1: Analyser

Lire le service automatiquement :
- Structure : `services/<service>/src/**/*.ts`
- Proto : `packages/proto/<context>_*.proto`
- Events : grep `EventPattern`, `natsPublisher.publish`
- DB : migrations, entities

Produire le baseline (aggregates, contrats, tables, tests).

### Phase 2: Compléter le blueprint

Poser des questions pour combler les gaps :

**Si ADD** : Quel élément ? Nom ? Paramètres ? Persistence ? Event ?
**Si MODIFY** : Quel fichier ? Logique actuelle ? Nouvelle logique ?
**Si REMOVE** : Quel élément ? Deprecate ou delete ? Dépendances ?

### Phase 3: Vérifier compatibilité

Si impact proto/events/db :
- Vérifier si breaking change
- Si oui → forcer choix : Versionner / Dual-write / Deprecate / Annuler

### Phase 4: Générer le plan

Pour chaque élément impacté, générer les steps avec les fichiers exacts et les diffs.

Charger le template approprié depuis `references/templates/`.

### Phase 5: Implémenter

Appliquer chaque step :
- Créer les nouveaux fichiers
- Modifier les fichiers existants
- Supprimer si nécessaire
- Créer les tests

### Phase 6: Valider

```bash
npm run build
npm run test
buf generate  # si proto
```

### Phase 7: Résumer

Lister : fichiers créés/modifiés/supprimés, migrations, tests, commandes de rollback.

## Modules (déclenchés automatiquement)

| Élément | Template | Fichiers générés |
|---------|----------|------------------|
| Command | [command.md](references/templates/command.md) | command.ts, handler.ts, proto, controller, test |
| Query | [query.md](references/templates/query.md) | query.ts, handler.ts, proto, controller, test |
| Event | [event.md](references/templates/event.md) | event.ts, publisher, listener, catalog |
| Field | [migration.md](references/templates/migration.md) | aggregate, entity, migration, mappers |

| Action | Pattern | Actions |
|--------|---------|---------|
| Add | [add-feature.md](references/patterns/add-feature.md) | Créer fichiers, registrer, valider |
| Modify | [modify-feature.md](references/patterns/modify-feature.md) | Lire, diff, appliquer, tester |
| Remove | [remove-feature.md](references/patterns/remove-feature.md) | Dépendances, deprecate/delete, reserved, migration |

## Règles

1. **Analyser avant d'agir** — Toujours Phase 1 avant modification
2. **Une question à la fois** — Phase 2 pose UNE question
3. **Vérifier compat** — STOP si breaking, forcer choix stratégie
4. **Valider** — Toujours build + tests après modification
5. **Rollback ready** — Toujours fournir les commandes de rollback
