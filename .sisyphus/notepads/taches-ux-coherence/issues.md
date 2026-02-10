# Issues & Gotchas - Tâches UX Coherence

## [2026-02-08] Wave 1 Issues

### Issue 1: TypeScript Proto Imports
**Symptom**: TypeScript errors about missing proto modules (@types/regle-relance, @proto/activites/activites)

**Root Cause**: Proto files may not be generated in development environment

**Impact**: Does not block work - these are expected in this environment

**Workaround**: Ignore these specific errors, verify other TypeScript errors are resolved

**Status**: EXPECTED - not a blocker

### Issue 2: LSP Server Not Found
**Symptom**: LSP server binary (typescript-language-server) not found in PATH on Windows

**Root Cause**: Environment setup issue

**Impact**: Prevents LSP-based TypeScript error checking

**Workaround**: Use `npx tsc --noEmit` directly for TypeScript validation

**Status**: ENVIRONMENTAL - not related to our changes

## Gotchas to Watch For

### Gotcha 1: Button asChild Pattern
**What**: When wrapping Link in Button, MUST use `asChild` prop

**Why**: Without asChild, Button renders its own element and Link becomes nested incorrectly

**Correct**:
```tsx
<Button variant="outline" asChild>
  <Link href="/path">Text</Link>
</Button>
```

**Incorrect**:
```tsx
<Button variant="outline">
  <Link href="/path">Text</Link>
</Button>
```

### Gotcha 2: AlertDialog State Management
**What**: Need TWO state variables for delete confirmation

**Why**: 
- One for dialog open/close state
- One for tracking which item to delete

**Pattern**:
```tsx
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
```

### Gotcha 3: Empty Component Import
**What**: ErrorState depends on Empty component

**Why**: ErrorState uses Empty, EmptyHeader, EmptyMedia, etc. as building blocks

**Verify**: Always check that `@/components/ui/empty` exists before using ErrorState

### Gotcha 4: Server Action Error Handling
**What**: Server actions return `{ data?, error? }` structure

**Pattern**:
```tsx
const result = await serverAction()
if (result.data) {
  // Success path
} else {
  setError(result.error || "Default error message")
}
```

**Don't**: Assume result.data always exists

## Wave 2 Potential Issues

### Potential Issue 1: Client Link Column Position
**Risk**: Adding column might break table layout or responsive design

**Mitigation**: Test on different screen sizes, verify column doesn't overflow

### Potential Issue 2: CreateTacheDialog clientId Prop
**Risk**: Dialog might not accept clientId prop or might not pre-fill correctly

**Mitigation**: Verify CreateTacheDialog component accepts clientId as optional prop (already confirmed in plan)

### Potential Issue 3: listTachesByClient Return Type
**Risk**: Server action might return different structure than expected

**Mitigation**: Check return type matches PaginatedTachesDto, handle pagination correctly
