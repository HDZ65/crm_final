# Frontend Zod Migration Plan

## Objectif

Remplacer tous les schémas Zod manuels dans le frontend par des schémas **générés automatiquement depuis proto**.

## État Actuel

**Fichiers identifiés avec Zod manuel** :

| Fichier | Type de Schéma | Action |
|---------|------------------|---------|
| `frontend/src/components/email-composer-dialog.tsx` | `emailComposerSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/catalogue/create-product-dialog.tsx` | `formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/catalogue/edit-product-dialog.tsx` | `formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/data-table.tsx` | `formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/create-contrat-dialog.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/create-client-dialog.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/create-societe-dialog.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/reset-password-form.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/commissions/edit-bareme-dialog.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/commissions/manage-paliers-dialog.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |
| `frontend/src/components/commissions/create-bareme-dialog.tsx` | `const formSchema = z.object(...)` | Remplacer par proto schema |

## Processus de Migration

### Étape 1 : Installer protoc-gen-zod

```bash
# Option A : Utiliser fubhy/protobuf-zod (recommandée)
git clone https://github.com/fubhy/protobuf-zod.git
cd protobuf-zod
npm install

# Créer un lien symbolique pour l'accès depuis frontend
mkdir -p proto/gen/zod
ln -s $(pwd)/node_modules/protobuf-zod/src $(pwd)/proto/gen/zod

# Option B : Attendre la release stable et utiliser npm install
# npm install --save-dev @bufbuild/validate-ts
```

### Étape 2 : Configurer buf.gen.yaml (déjà fait)

```yaml
# proto/buf.gen.yaml
plugins:
  # ... plugins existants ...

  # Zod validation schemas generation from proto
  - local: protoc-gen-zod
    out: proto/gen/zod
    opt:
      - target=ts
      - paths=source_relative
```

### Étape 3 : Générer les schémas Zod depuis proto

```bash
cd crm_final
npm run proto:generate
```

Résultat : Schémas Zod générés dans `proto/gen/zod/`

### Étape 4 : Migrer les composants frontend

**Modèle ❌ INTERDIT (actuel)** :
```typescript
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  societeId: z.string().min(1, "Requis"),
  nom: z.string().min(1, "Requis"),
  sku: z.string().min(1, "Requis"),
  description: z.string().min(1, "Requis"),
  devise: z.string().default("EUR"),
  fournisseur: z.string().optional(),
  actif: z.boolean().default(true),
});

export default function CreateProductDialog() {
  const { register } = useForm({
    resolver: zodResolver(formSchema),
    // ...
  });
}
```

**Modèle ✅ CORRECT (cible)** :
```typescript
// Importer le schéma Zod GÉNÉRÉ depuis proto
import { CreateProduitRequestSchema } from '@proto/gen/zod/produits/produit';
import { zodResolver } from "@hookform/resolvers/zod";

export default function CreateProductDialog() {
  const { register } = useForm({
    // Utiliser le schéma proto-generated
    resolver: zodResolver(CreateProduitRequestSchema),
    // ...
  });
}
```

### Étape 5 : Correspondance Proto ↔ Schéma Zod

**Proto (proto/produits/produit.proto)** :
```protobuf
message CreateProduitRequest {
  string societe_id = 1;
  string nom = 2;
  string sku = 3;
  string description = 4;
  string devise = 5;
  optional string fournisseur = 6;
  bool actif = 7;
}
```

**Schéma Zod généré (proto/gen/zod/produits/produit.ts)** :
```typescript
import { z } from 'zod';

export const CreateProduitRequestSchema = z.object({
  societeId: z.string(),
  nom: z.string(),
  sku: z.string(),
  description: z.string(),
  devise: z.string(),
  fournisseur: z.string().optional(),
  actif: z.boolean(),
});
```

## Liste des Correspondances à Vérifier

| Proto Message | Proto File | Schéma Zod généré | Composant Frontend |
|---------------|-------------|--------------------|-------------------|
| `CreateClientBaseRequest` | `proto/clients/clients.proto` | `CreateClientBaseRequestSchema` | `create-client-dialog.tsx` |
| `CreateProduitRequest` | `proto/produits/produit.proto` | `CreateProduitRequestSchema` | `catalogue/create-product-dialog.tsx` |
| `UpdateProduitRequest` | `proto/produits/produit.proto` | `UpdateProduitRequestSchema` | `catalogue/edit-product-dialog.tsx` |
| `CreateContratRequest` | `proto/contrats/contrats.proto` | `CreateContratRequestSchema` | `create-contrat-dialog.tsx` |
| `EmailComposerRequest` | `proto/email/email.proto` | `EmailComposerRequestSchema` | `email-composer-dialog.tsx` |
| `CreateBaremeRequest` | `proto/commission/bareme.proto` | `CreateBaremeRequestSchema` | `commissions/create-bareme-dialog.tsx` |
| `CreateSocieteRequest` | `proto/organisations/societe.proto` | `CreateSocieteRequestSchema` | `create-societe-dialog.tsx` |
| `ResetPasswordRequest` | `proto/auth/auth.proto` | `ResetPasswordRequestSchema` | `reset-password-form.tsx` |

## Script de Migration Automatique

```bash
#!/bin/bash
# scripts/migrate-frontend-zod.sh

echo "=== Frontend Zod Migration ==="

# Étape 1 : Installer protoc-gen-zod
if [ ! -d "node_modules/protobuf-zod" ]; then
  echo "Installing protoc-gen-zod..."
  git clone https://github.com/fubhy/protobuf-zod.git tmp/protobuf-zod
  cd tmp/protobuf-zod
  npm install
  cd ../..
  rm -rf tmp/protobuf-zod
fi

# Étape 2 : Générer les schémas Zod depuis proto
echo "Generating Zod schemas from proto..."
npm run proto:generate

# Étape 3 : Identifier les fichiers à migrer
echo "Finding manual Zod schemas..."
FILES=$(grep -r "z.object\|z.string\|z.number\|z.boolean\|z.array" frontend/src --include="*.tsx" | grep -v "import.*from.*@proto/gen/zod" | cut -d: -f1 | sort -u)

for file in $FILES; do
  echo "Processing: $file"

  # Extraire le nom du message proto probable
  MESSAGE_NAME=$(basename "$file" .tsx | sed 's/-dialog//; s/-form//; s/\.//; s/\(.*\)/\u\1/')

  # Créer le commentaire de migration
  cat > "$file.new" << 'EOF'
// MIGRATION: Zod manuel → Zod généré depuis proto
//
// AVANT: const formSchema = z.object({ ... })  (Zod manuel)
// APRÈS: import { CreateXxxRequestSchema } from '@proto/gen/zod/xxx/xxx'
//
// Pour migrer:
// 1. Supprimer la définition manuelle z.object(...)
// 2. Importer le schéma proto-generated correspondant
// 3. Utiliser le schéma proto dans le zodResolver()
//
// Correspondance Proto → Schéma Zod:
// - CreateClientBaseRequest → CreateClientBaseRequestSchema
// - CreateProduitRequest → CreateProduitRequestSchema
// - etc. (voir MIGRATION_PLAN.md pour la liste complète)
$(cat "$file" | tail -n +2)

  # Renommer l'ancien fichier
  mv "$file.new" "$file.migrated"

  echo "Created: $file.migrated (manual review required)"
done

echo ""
echo "=== Migration complete ==="
echo "Please review each .migrated file and manually apply the migration."
echo "After review: mv file.tsx.migrated file.tsx"
EOF

chmod +x scripts/migrate-frontend-zod.sh
```

## Checklist de Migration

- [ ] `protoc-gen-zod` installé
- [ ] `buf.gen.yaml` configuré avec plugin Zod
- [ ] Schémas Zod générés depuis proto (`npm run proto:generate`)
- [ ] Correspondance Proto ↔ Zod vérifiée
- [ ] `scripts/migrate-frontend-zod.sh` exécuté
- [ ] Chaque fichier `.migrated` revu et appliqué manuellement
- [ ] Fichiers manuels Zod supprimés
- [ ] Test des formulaires frontend après migration
- [ ] Validation : Les données frontend sont en camelCase
- [ ] Validation : Aucune erreur silencieuse sur Zod validation

## Notes Importantes

1. **Jamais créer de nouveaux schémas Zod manuels**
   - Utiliser uniquement les schémas générés depuis proto
   - Si un proto message n'existe pas, le créer DANS le proto

2. **Correspondance des noms**
   - `CreateXxxRequest` dans proto → `CreateXxxRequestSchema` dans Zod
   - Les imports doivent être : `from '@proto/gen/zod/package/message'`

3. **Validation explicite**
   - Ne jamais utiliser `z.unknown()`, `z.any()`
   - Ne jamais utiliser `.default()` sans justification
   - Les messages d'erreur doivent être explicites

4. **Tests**
   - Après migration, tester chaque formulaire
   - Vérifier que les données validées sont envoyées correctement à l'API

---

**Projet** : CRM Final - Multi-tenant White Label Partner Management System
**Date** : 19 janvier 2026
**Version** : 1.0.0 - Frontend Zod Migration Plan
