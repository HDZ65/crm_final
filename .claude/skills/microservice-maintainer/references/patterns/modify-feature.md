# Pattern: Modifier une Feature

## Scope

Ce pattern couvre :
- Bugfix (corriger un comportement)
- Refactor (améliorer le code sans changer le comportement)
- Perf (optimisation)
- Changement de logique métier

---

## Workflow

```
1. Identifier le fichier/la zone à modifier
2. Comprendre le comportement actuel
3. Identifier l'impact (autres fichiers, contrats)
4. Vérifier la compatibilité
5. Appliquer le changement minimal
6. Valider (tests existants + nouveau test si besoin)
```

---

## 1. Bugfix

### Approche
- **Minimal** : corriger uniquement le bug, pas de refactor
- **Ciblé** : toucher le moins de fichiers possible
- **Testé** : ajouter un test qui reproduit le bug

### Steps

| # | Action |
|---|--------|
| 1 | Localiser le bug (grep, lecture code) |
| 2 | Écrire un test qui échoue (reproduit le bug) |
| 3 | Corriger le code (diff minimal) |
| 4 | Vérifier que le test passe |
| 5 | Vérifier que les autres tests passent |

### Règles
- Ne pas refactorer autour du bug
- Ne pas "améliorer" le code adjacent
- Un bug = une correction = un test

### Exemple : Bugfix validation

```typescript
// AVANT (bug: accepte les montants négatifs)
static create(userId: string, amount: number): Invoice {
  const invoice = new Invoice();
  invoice.amount = amount;
  return invoice;
}

// APRÈS (fix: rejeter les montants négatifs)
static create(userId: string, amount: number): Invoice {
  if (amount < 0) {
    throw new DomainError('Amount cannot be negative');
  }
  const invoice = new Invoice();
  invoice.amount = amount;
  return invoice;
}

// TEST ajouté
it('should reject negative amounts', () => {
  expect(() => Invoice.create('user-1', -100)).toThrow('Amount cannot be negative');
});
```

---

## 2. Refactor

### Approche
- **Comportement identique** : entrées/sorties ne changent pas
- **Golden Master** : capturer l'output avant, comparer après
- **Petits pas** : refactorer par étapes validées

### Steps

| # | Action |
|---|--------|
| 1 | Identifier la zone à refactorer |
| 2 | S'assurer que des tests existent (sinon en créer) |
| 3 | Capturer le comportement actuel (golden master) |
| 4 | Refactorer par petites étapes |
| 5 | Valider après chaque étape |
| 6 | Comparer entrées/sorties |

### Règles
- Ne pas changer le comportement
- Ne pas ajouter de features
- Tests doivent passer avant ET après

### Golden Master Pattern

```typescript
// 1. Capturer l'output actuel
const inputs = [
  { userId: 'u1', amount: 100 },
  { userId: 'u2', amount: 0 },
  { userId: 'u3', amount: 999 },
];

const goldenOutputs = inputs.map(i => handler.execute(i));
// Sauvegarder goldenOutputs

// 2. Refactorer

// 3. Comparer
const newOutputs = inputs.map(i => handler.execute(i));
expect(newOutputs).toEqual(goldenOutputs);
```

### Exemple : Refactor extraction méthode

```typescript
// AVANT (handler fait trop de choses)
async execute(command: CreateInvoiceCommand): Promise<string> {
  // Validation
  if (!command.userId) throw new Error('userId required');
  if (!command.name || command.name.length < 2) throw new Error('name too short');
  if (command.amount < 0) throw new Error('negative amount');

  // Création
  const invoice = Invoice.create(command.userId, command.name, command.amount);
  await this.repository.save(invoice);

  // Events
  invoice.getUncommittedEvents().forEach(e => this.eventBus.publish(e));
  invoice.commit();

  return invoice.getId();
}

// APRÈS (extraction vers l'aggregate)
async execute(command: CreateInvoiceCommand): Promise<string> {
  // La validation est maintenant dans Invoice.create()
  const invoice = Invoice.create(command.userId, command.name, command.amount);
  await this.repository.save(invoice);

  invoice.getUncommittedEvents().forEach(e => this.eventBus.publish(e));
  invoice.commit();

  return invoice.getId();
}
```

---

## 3. Perf

### Approche
- **Mesurer avant** : identifier le bottleneck
- **Cibler** : optimiser uniquement le bottleneck
- **Mesurer après** : valider l'amélioration

### Steps

| # | Action |
|---|--------|
| 1 | Mesurer la performance actuelle (latence, CPU, queries) |
| 2 | Identifier le bottleneck |
| 3 | Proposer une optimisation |
| 4 | Implémenter |
| 5 | Mesurer après |
| 6 | Valider (tests fonctionnels passent) |

### Optimisations courantes

| Problème | Solution |
|----------|----------|
| N+1 queries | Eager loading / JOIN |
| Table scan | Ajouter index |
| Gros payload | Pagination / Projection |
| Calcul répété | Cache / Memoization |
| Sync bloquant | Async / Queue |

### Exemple : Ajout index

```typescript
// Symptôme : query lente sur findByUserId
// Cause : pas d'index sur user_id

// Solution : Migration pour ajouter index
export class AddIndexInvoicesUserId implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_invoices_user_id
      ON invoices(user_id)
      WHERE deleted_at IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX idx_invoices_user_id');
  }
}
```

---

## 4. Changement de logique métier

### Approche
- **Comprendre l'existant** : lire le code actuel
- **Identifier l'impact** : qui dépend de ce comportement ?
- **Backward compat** : peut-on supporter les deux logiques ?
- **Tests** : mettre à jour les tests

### Steps

| # | Action |
|---|--------|
| 1 | Lire le code actuel |
| 2 | Identifier les appelants (grep) |
| 3 | Évaluer l'impact (breaking ?) |
| 4 | Si breaking → voir pattern compat |
| 5 | Modifier le code |
| 6 | Mettre à jour les tests |
| 7 | Valider |

### Attention aux breaking changes

Si le changement impacte :
- **Proto** (champs, sémantique) → Voir [compatibility-proto.md](../compatibility-proto.md)
- **Events** (payload, sémantique) → Voir [compatibility-events.md](../compatibility-events.md)
- **DB** (schema) → Voir [compatibility-db.md](../compatibility-db.md)

### Exemple : Changer la logique de calcul

```typescript
// AVANT : TVA fixe 20%
calculateTotal(): number {
  return this.amountHT * 1.20;
}

// APRÈS : TVA variable selon le type
calculateTotal(): number {
  const tvaRate = this.getTvaRate();  // Nouvelle méthode
  return this.amountHT * (1 + tvaRate);
}

private getTvaRate(): number {
  switch (this.type) {
    case InvoiceType.SERVICE: return 0.20;
    case InvoiceType.PRODUCT: return 0.20;
    case InvoiceType.DIGITAL: return 0.055;
    default: return 0.20;
  }
}

// TEST mis à jour
it('should apply correct TVA rate for digital products', () => {
  const invoice = Invoice.create({ type: InvoiceType.DIGITAL, amountHT: 100 });
  expect(invoice.calculateTotal()).toBe(105.5);  // 5.5% TVA
});
```

---

## Checklist

### Avant modification
- [ ] Zone identifiée
- [ ] Comportement actuel compris
- [ ] Tests existants localisés
- [ ] Impact évalué (autres fichiers, contrats)

### Pendant modification
- [ ] Diff minimal (pas de changements non demandés)
- [ ] Pas de refactor opportuniste
- [ ] Tests mis à jour si besoin

### Après modification
- [ ] Tests existants passent
- [ ] Nouveau test ajouté (si bugfix ou nouvelle logique)
- [ ] `npm run build` passe
- [ ] Pas de régression

---

## Budget modification

| Type | Max fichiers | Max lignes changées |
|------|--------------|---------------------|
| Bugfix | 3 | 20 |
| Refactor local | 5 | 50 |
| Perf | 3 | 30 |
| Logique métier | 5 | 50 |

**Si dépassé** → Considérer split en plusieurs PRs
