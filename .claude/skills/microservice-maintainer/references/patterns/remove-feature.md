# Pattern: Supprimer une Feature

## Scope

Ce pattern couvre :
- Deprecation (marquer obsolète, garder fonctionnel)
- Soft removal (désactiver, code encore présent)
- Hard removal (supprimer le code)
- Cleanup (supprimer code mort)

---

## Workflow

```
1. Identifier l'élément à supprimer
2. Trouver toutes les dépendances
3. Évaluer l'impact (breaking ?)
4. Choisir la stratégie (deprecate/remove)
5. Appliquer par phases
6. Nettoyer (Contract phase si applicable)
```

---

## 1. Identifier les dépendances

### Recherche exhaustive

```bash
# Trouver tous les usages d'une fonction/classe
grep -r "<FunctionName>" services/ packages/

# Trouver les imports
grep -r "import.*<ClassName>" services/

# Trouver les EventPattern (consumers)
grep -r "EventPattern.*<topic>" services/

# Trouver les appels gRPC
grep -r "<RpcMethod>" services/ gateway/

# Trouver les références proto
grep -r "<MessageName>" packages/proto/
```

### Catégoriser

| Catégorie | Action |
|-----------|--------|
| Code interne au service | Modifier/supprimer |
| Autres services (même monorepo) | Coordonner |
| Clients externes (gateway, apps) | ⚠️ Breaking change |
| Proto publié | ⚠️ Breaking change |
| Events consommés | ⚠️ Breaking change |

---

## 2. Stratégies

### Deprecation (recommandé)

**Quand** : Contrat public (proto, events), migration progressive

```typescript
// Proto
message OldRequest {
  option deprecated = true;  // Marqué deprecated
  string field = 1;
}

// Code
/** @deprecated Use newMethod instead */
async oldMethod(): Promise<void> {
  console.warn('oldMethod is deprecated, use newMethod');
  return this.newMethod();
}
```

### Soft Removal (feature flag)

**Quand** : Besoin de rollback rapide

```typescript
// Désactiver via config
async processInvoice(invoice: Invoice): Promise<void> {
  if (this.config.get('FEATURE_OLD_PROCESSING_ENABLED')) {
    return this.oldProcessing(invoice);
  }
  return this.newProcessing(invoice);
}
```

### Hard Removal

**Quand** : Aucune dépendance externe, code mort confirmé

```bash
# Supprimer les fichiers
rm src/application/commands/old-feature.command.ts
rm src/application/commands/handlers/old-feature.handler.ts

# Nettoyer les imports
# Nettoyer le module
```

---

## 3. Suppression par type d'élément

### Supprimer une Command/Query

| # | Action |
|---|--------|
| 1 | Vérifier aucun appel interne |
| 2 | Vérifier aucun appel gRPC externe |
| 3 | Marquer deprecated dans proto (si public) |
| 4 | Supprimer handler du module |
| 5 | Supprimer fichiers (command, handler, test) |
| 6 | Marquer `reserved` dans proto |

```protobuf
// Proto : marquer reserved après suppression
service BillingCommandsService {
  // rpc OldMethod était ici
  reserved 3;  // Réserver le numéro du RPC supprimé
}

message OldRequest {
  reserved 1, 2, 3;
  reserved "old_field", "legacy_field";
}
```

### Supprimer un Event

| # | Action |
|---|--------|
| 1 | Identifier tous les consumers |
| 2 | Migrer les consumers vers nouvel event (si applicable) |
| 3 | Arrêter de publier l'event |
| 4 | Supprimer le handler publisher |
| 5 | Mettre à jour event_catalog (deprecated) |
| 6 | Après migration complète : supprimer l'event |

```yaml
# event_catalog.yaml
events:
  - name: billing.invoice.legacy_event
    status: deprecated  # Marquer deprecated
    deprecation_date: 2024-03-01
    replacement: billing.invoice.new_event
    consumers: []  # Plus de consumers
```

### Supprimer un champ Aggregate

| # | Action |
|---|--------|
| 1 | Vérifier aucune lecture du champ |
| 2 | Marquer deprecated dans proto |
| 3 | Supprimer du DTO |
| 4 | Supprimer du mapper |
| 5 | Garder en DB (ou migration Contract plus tard) |
| 6 | Supprimer de l'aggregate |

```typescript
// Phase 1 : Deprecated
/** @deprecated */
getLegacyField(): string {
  return this.legacyField;
}

// Phase 2 : Suppression (après vérification aucun usage)
// Supprimer la propriété et le getter
```

### Supprimer une colonne DB

**Pattern Expand/Contract inversé**

| # | Action |
|---|--------|
| 1 | Arrêter d'écrire dans la colonne (code) |
| 2 | Arrêter de lire la colonne (code) |
| 3 | Vérifier aucune dépendance |
| 4 | Migration : DROP COLUMN |

```typescript
// Migration Contract : suppression
export class RemoveLegacyColumn implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'legacy_field');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Recréer la colonne (sans données)
    await queryRunner.addColumn('invoices', new TableColumn({
      name: 'legacy_field',
      type: 'varchar',
      isNullable: true,
    }));
  }
}
```

---

## 4. Cleanup code mort

### Détection

```bash
# Fonctions non utilisées (TypeScript)
npx ts-prune

# Exports non utilisés
npx unimported

# Dead code
npx deadcode
```

### Checklist cleanup

- [ ] Aucun import du fichier
- [ ] Aucune référence grep
- [ ] Aucun test qui l'utilise
- [ ] Pas dans le module (providers, controllers)

### Suppression sûre

```bash
# 1. Supprimer le fichier
rm src/application/commands/unused-command.ts

# 2. Build pour vérifier
npm run build

# 3. Si erreur : le code n'était pas mort
# Si pas d'erreur : commit
```

---

## 5. Vérification breaking changes

### Proto

| Action | Breaking ? |
|--------|------------|
| Supprimer champ | ✅ OUI |
| Supprimer RPC | ✅ OUI |
| Marquer deprecated | ❌ Non |
| Reserved | ❌ Non |

### Events

| Action | Breaking ? |
|--------|------------|
| Arrêter de publier | ✅ OUI (consumers attendent) |
| Supprimer champ payload | ✅ OUI |
| Dual publish + deprecate | ❌ Non |

### DB

| Action | Breaking ? |
|--------|------------|
| DROP COLUMN avec données | ⚠️ Perte données |
| DROP TABLE | ⚠️ Perte données |
| Après Contract clean | ❌ Non |

---

## Checklist

### Avant suppression
- [ ] Toutes les dépendances identifiées
- [ ] Impact évalué (breaking ?)
- [ ] Stratégie choisie (deprecate/remove)
- [ ] Consumers notifiés (si external)

### Pendant suppression
- [ ] Proto : reserved ajouté
- [ ] Catalog : deprecated marqué
- [ ] Code : supprimé progressivement
- [ ] Tests : nettoyés

### Après suppression
- [ ] `npm run build` passe
- [ ] `npm run test` passe
- [ ] Aucune référence restante (grep)
- [ ] Documentation mise à jour

---

## Exemple complet : Supprimer OldQuery

```
1. DÉPENDANCES
   grep -r "OldQuery" services/
   → billing.queries.grpc-controller.ts (méthode getOldData)
   → old-query.handler.ts
   → old-query.spec.ts
   → billing_queries.proto (rpc GetOldData)

2. IMPACT
   → Proto public = breaking change potentiel
   → Vérifier gateway : pas d'appel → OK

3. STRATÉGIE
   → Deprecation d'abord, removal dans 2 sprints

4. PHASE 1 : DEPRECATION
   Proto:
     rpc GetOldData(GetOldDataRequest) returns (GetOldDataResponse) {
       option deprecated = true;
     }

   Code:
     /** @deprecated Use getNewData instead. Removal planned: 2024-04-01 */
     async getOldData(request): Promise<Response> {
       console.warn('getOldData is deprecated');
       return this.handler.execute(new OldQuery(request.id));
     }

5. PHASE 2 : REMOVAL (2 sprints plus tard)
   - Vérifier aucun appel (logs, metrics)
   - Supprimer du controller
   - Supprimer handler du module
   - Supprimer fichiers (query, handler, test)
   - Proto : reserved 5; // GetOldData était field 5
   - Build + test
```
