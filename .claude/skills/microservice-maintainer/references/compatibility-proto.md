# Compatibilité Proto (gRPC/Protobuf)

## Règle d'or
**Ne jamais casser les clients existants.** Un consumer compilé avec l'ancien proto doit continuer à fonctionner.

---

## Patterns SAFE (autorisés)

### 1. Ajouter un champ optional
```protobuf
message CreateInvoiceRequest {
  string user_id = 1;
  string name = 2;
  optional int64 amount = 15;  // ✅ NOUVEAU - optional + nouveau numéro
}
```
**Règles:**
- Toujours `optional` ou avec valeur par défaut
- Utiliser le prochain numéro disponible
- Ne jamais réutiliser un numéro supprimé

### 2. Ajouter un nouveau RPC
```protobuf
service BillingCommandsService {
  rpc CreateInvoice(CreateInvoiceRequest) returns (CreateInvoiceResponse);
  rpc UpdateInvoice(UpdateInvoiceRequest) returns (UpdateInvoiceResponse);
  rpc ArchiveInvoice(ArchiveInvoiceRequest) returns (ArchiveInvoiceResponse);  // ✅ NOUVEAU
}
```

### 3. Deprecate sans supprimer
```protobuf
message InvoiceDto {
  string id = 1;
  string name = 2;
  string old_status = 3 [deprecated = true];  // ✅ Marqué deprecated
  InvoiceStatus status = 4;                    // ✅ Nouveau champ
}
```

### 4. Reserved pour éviter réutilisation
```protobuf
message InvoiceDto {
  reserved 5, 6;           // ✅ Numéros réservés (anciens champs supprimés)
  reserved "legacy_field"; // ✅ Nom réservé
  string id = 1;
  string name = 2;
}
```

### 5. Dual Read (accepter ancien + nouveau)
```typescript
// Dans le handler, accepter les deux formats
async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  // Dual read : ancien champ OU nouveau champ
  const amount = request.amount ?? request.legacyAmount ?? 0;
  // ...
}
```

---

## Patterns INTERDITS (breaking changes)

### ❌ Renuméroter un champ
```protobuf
// AVANT
message Invoice { string id = 1; string name = 2; }

// APRÈS - INTERDIT
message Invoice { string id = 1; string name = 3; }  // ❌ name était 2 !
```
**Conséquence:** Les clients existants liront des données corrompues.

### ❌ Supprimer un champ
```protobuf
// AVANT
message Invoice { string id = 1; string name = 2; string status = 3; }

// APRÈS - INTERDIT
message Invoice { string id = 1; string name = 2; }  // ❌ status supprimé !
```
**Alternative:** Marquer `deprecated = true` et ignorer côté serveur.

### ❌ Changer le type d'un champ
```protobuf
// AVANT
message Invoice { int32 amount = 3; }

// APRÈS - INTERDIT
message Invoice { int64 amount = 3; }  // ❌ type changé !
```
**Alternative:** Ajouter un nouveau champ `int64 amount_v2 = 4;`.

### ❌ Renommer un champ (pour wire format)
Le nom n'affecte pas le wire format protobuf, mais :
- Casse la génération côté client
- Casse les JSON transcoding (REST gateway)
- Casse les logs/debug

### ❌ Changer un champ required en optional (ou vice versa)
Proto3 n'a plus de `required`, mais attention aux validations.

---

## Stratégies de migration

### Migration simple (ajout)
```
1. Ajouter champ optional dans proto
2. Générer : buf generate
3. Copier : cp -r gen/ts/* services/<service>/proto/generated/
4. Déployer service (accepte ancien + nouveau)
5. Update clients progressivement
```

### Migration complexe (remplacement)
```
Phase 1: Expand
- Ajouter nouveau champ (optional)
- Serveur écrit ancien + nouveau (dual write)
- Serveur lit nouveau OU ancien (dual read)

Phase 2: Switch
- Tous les clients utilisent le nouveau champ
- Serveur continue dual read

Phase 3: Contract
- Marquer ancien champ deprecated
- Serveur ignore ancien champ
- (Optionnel) Supprimer après X releases + reserved
```

---

## Vérifications avant PR

### Checklist proto
```bash
# 1. Vérifier les numéros de champs
diff -u old.proto new.proto | grep -E "^\+" | grep "="

# 2. Vérifier pas de suppression
diff -u old.proto new.proto | grep -E "^\-" | grep "="

# 3. Lint buf
cd packages/proto && buf lint

# 4. Breaking changes check
buf breaking --against '.git#branch=main'

# 5. Générer et vérifier compilation
buf generate
```

### Semantic check (manuel)
Poser ces questions :
1. "Le sens du champ change-t-il ?"
2. "Un consumer pourrait-il mal interpréter ?"
3. "Les invariants métier changent-ils ?"

---

## Exemple : Ajouter un champ amount

### Proto avant
```protobuf
message CreateInvoiceRequest {
  string user_id = 1;
  string name = 2;
  string description = 3;
}

message CreateInvoiceResponse {
  bool success = 1;
  string id = 2;
}
```

### Proto après
```protobuf
message CreateInvoiceRequest {
  string user_id = 1;
  string name = 2;
  string description = 3;
  optional int64 amount_cents = 4;  // ✅ Nouveau champ optional
}

message CreateInvoiceResponse {
  bool success = 1;
  string id = 2;
}
```

### Handler avec dual read
```typescript
@GrpcMethod('BillingCommandsService', 'CreateInvoice')
async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  const command = new CreateInvoiceCommand(
    request.userId,
    request.name,
    request.description,
    request.amountCents ?? 0,  // Valeur par défaut si absent
  );

  const invoice = await this.commandBus.execute(command);
  return { success: true, id: invoice.id };
}
```

---

## Notes Winaity-specific

### Convention de nommage
- Package: `winaity.<context>.commands` / `winaity.<context>.queries`
- Service: `<Context>CommandsService`, `<Context>QueriesService`
- Request: `<Action><Entity>Request`
- Response: `<Action><Entity>Response`

### Séparation Commands/Queries
Toujours séparer en 2 fichiers :
- `<context>_commands.proto` : mutations
- `<context>_queries.proto` : lectures

### Buf workflow
```bash
cd packages/proto
buf generate
cp -r gen/ts/* ../services/<service>/proto/generated/
```
