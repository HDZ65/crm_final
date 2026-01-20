# Pull Request - Contract-Driven Architecture

## Description

<!-- Describe your changes -->

## Type of Change

- [ ] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Proto schema change

---

## ✅ Contract-Driven Architecture Checklist (MANDATORY)

### Proto Files

- [ ] All `.proto` files use **snake_case** for fields, messages, and RPCs
- [ ] NO camelCase in proto files
- [ ] `buf lint` passes with **ZERO warnings**
- [ ] `buf breaking` passes (or breaking changes are documented below)
- [ ] All fields have validation rules (buf.validate) where appropriate
- [ ] Proto changes are backward compatible OR deprecation documented

### Generated Code

- [ ] Code generated via `buf generate` (not manually edited)
- [ ] Generated code committed (proto/gen/)
- [ ] NO manual edits in `proto/gen/**/*`
- [ ] Generation is deterministic

### Application Code

- [ ] All types imported from `@proto/gen/*` (frontend or services)
- [ ] **ZERO manual DTOs** for API contracts
- [ ] **ZERO `@Column({ name: '...' })`** in entities
- [ ] All code uses **camelCase** (no snake_case variables)
- [ ] **NO `any`** or `unknown` types (unless absolutely necessary with comment)
- [ ] NO manual mapping functions (proto ↔ entity)

### Database

- [ ] All tables/columns use snake_case
- [ ] Migrations generated from entities
- [ ] **NO manual column name overrides**
- [ ] Used `StrictContractDrivenNamingStrategy`

### Validation

- [ ] Validation rules in `.proto` files
- [ ] NO class-validator decorators duplicating proto rules
- [ ] Validation errors fail fast

### Testing

- [ ] Tests use generated types
- [ ] NO mock DTOs differing from proto
- [ ] All tests pass locally
- [ ] Breaking changes fail CI

---

## 🚫 Anti-Pattern Verification

I confirm this PR does **NOT** contain:

- [ ] ❌ Manual DTO classes (*.dto.ts)
- [ ] ❌ Manual mapping functions (mapProtoToX, mapXToProto)
- [ ] ❌ `@Column({ name: '...' })` decorators
- [ ] ❌ Parallel schemas (OpenAPI, Zod manually written)
- [ ] ❌ snake_case in TypeScript variables
- [ ] ❌ camelCase in proto files
- [ ] ❌ `any` type without justification
- [ ] ❌ Silent error handling / fallbacks
- [ ] ❌ Manual snake_case ↔ camelCase conversion
- [ ] ❌ "Temporary" technical debt

---

## Breaking Changes

<!-- If this PR introduces breaking changes, document them here -->

- [ ] No breaking changes
- [ ] Breaking changes documented below:

**Breaking Changes:**
```
<!-- List breaking changes and migration path -->
```

**Deprecation Notice:**
```
<!-- If deprecating fields, list here with timeline -->
```

---

## Testing

<!-- Describe how you tested your changes -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

**Test Evidence:**
```bash
# Paste test output here
```

---

## Proto Generation

- [ ] Ran `cd proto && buf generate`
- [ ] Committed generated files
- [ ] Verified no uncommitted changes in `proto/gen/`

**Generation Output:**
```bash
# Paste buf generate output
```

---

## Database Migrations

- [ ] No database changes
- [ ] Migration generated: `npm run migration:generate -- MigrationName`
- [ ] Migration tested locally
- [ ] Migration is reversible (down migration exists)

**Migration File:**
```
<!-- Path to migration file if applicable -->
```

---

## Documentation

- [ ] README updated (if needed)
- [ ] Proto files documented (comments)
- [ ] API documentation updated
- [ ] Migration guide updated (for breaking changes)

---

## Reviewer Checklist

### For Reviewers (DO NOT MERGE if any ❌)

**Proto Review:**
- [ ] Proto files follow snake_case convention
- [ ] `buf lint` passes (check CI)
- [ ] `buf breaking` passes or changes approved
- [ ] Validation rules are appropriate

**Code Quality:**
- [ ] NO manual DTOs
- [ ] NO `@Column({ name: '...' })`
- [ ] NO `any` types (or justified with comments)
- [ ] Types imported from `@proto/gen/*`
- [ ] NO manual mapping functions

**Testing:**
- [ ] Tests cover new functionality
- [ ] All CI checks pass
- [ ] No flaky tests introduced

**Architecture:**
- [ ] Follows contract-driven principles
- [ ] No technical debt introduced
- [ ] Breaking changes properly documented

---

## Additional Notes

<!-- Any additional information for reviewers -->

---

## Related Issues

Closes #<!-- issue number -->

---

**By submitting this PR, I confirm:**

- I have read and followed the [Contract-Driven Architecture Guide](../CONTRACT_DRIVEN_ARCHITECTURE.md)
- I have run `buf lint` and `buf generate` locally
- All anti-patterns have been avoided
- This code is production-ready
