# Learnings - Tâches UX Coherence

## [2026-02-08] Wave 1 Completed

### Task 0 - ErrorState Component
- Successfully copied ErrorState component from clone/winaity-clean
- Component uses Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent from @/components/ui/empty
- Supports 9 error types: network, unauthorized, forbidden, not-found, validation, conflict, timeout, internal, generic
- File: `frontend/src/components/ui/error-state.tsx` (199 lines)

### Task 3 - Navigation Between Tasks and Config
- Added Settings2 icon button on `/taches` page → navigates to `/taches/configuration`
- Added "Retour aux tâches" button on `/taches/configuration` → navigates back to `/taches`
- Used Next.js Link component with Button asChild pattern
- Added Tooltip on Settings2 button for better UX

### Task 4 - AlertDialog for Delete Confirmation
- Replaced native `confirm()` with Shadcn AlertDialog on configuration page
- Pattern: state variables (deleteRegleDialogOpen, regleToDelete), handler (handleDeleteConfirm)
- AlertDialog shows rule name in description for clarity
- Consistent with task deletion pattern on main page

### Task 6 - SiteHeader Titles
- Added route mappings in site-header.tsx:
  - `/taches` → "Gestion des Tâches"
  - `/taches/configuration` → "Configuration des Relances"
- Followed existing pattern for route title mapping

## Conventions Discovered

### Navigation Pattern
- Use `<Button variant="outline" size="icon" asChild><Link href="..."><Icon /></Link></Button>` for icon navigation buttons
- Use `<Button variant="ghost" size="sm" asChild><Link href="..."><ChevronLeft />Text</Link></Button>` for back buttons

### Dialog Pattern
- State: `[dialogOpen, setDialogOpen]` + `[selectedItem, setSelectedItem]`
- Handler 1: `handleClick` → sets selectedItem and opens dialog
- Handler 2: `handleConfirm` → executes action, closes dialog
- JSX: AlertDialog with title, description (including item name), Cancel + Destructive button

### Import Organization
- Shadcn components from `@/components/ui/*`
- Icons from `lucide-react`
- Next.js Link from `next/link`
- Server actions from `@/actions/*`

## Technical Notes

### TypeScript Compilation
- Some proto type imports may be missing in development environment
- These are expected and don't block the work
- Always verify with `npx tsc --noEmit` after changes

### LSP Server
- LSP server binary not found in PATH on Windows (environmental issue)
- Does not prevent code changes or verification
- Use TypeScript compiler directly for validation

## [2026-02-08] Wave 2 - Client Column Addition

### Task 1 - Client Column in Task Table
- Added new "Client" column to task table in `frontend/src/app/(main)/taches/columns.tsx`
- Column positioned between "Assigné à" and "Échéance" columns
- Functionality:
  - Shows clickable badge with truncated UUID (first 8 chars) when clientId exists
  - Shows dash "—" when clientId is null
  - Clicking badge navigates to `/clients/{clientId}` via Next.js Link
  - Badge includes ExternalLink icon to indicate navigation
  - Uses `variant="outline"` with hover effect (`hover:bg-muted`)
- Imports added:
  - `Link` from `next/link`
  - `ExternalLink` from `lucide-react`
- TypeScript compilation: No new errors introduced
- Pattern follows existing column definitions (similar to "Assigné à" and "Description" columns)

## Patterns Confirmed

### Column Definition Pattern
- Use `accessorKey` for data field mapping
- Use `header` for column title
- Cell function receives `{ row }` with `row.original` containing full data object
- For navigation: wrap Badge in Link component with `href` prop
- For conditional rendering: check falsy values and return appropriate JSX

### Link + Badge Pattern
- `<Link href={path}><Badge variant="outline">{content}</Badge></Link>`
- Badge automatically becomes clickable when wrapped in Link
- Add `cursor-pointer hover:bg-muted` for visual feedback
- Use ExternalLink icon to indicate navigation to another page

