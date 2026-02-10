
## [2026-02-08 22:16] Build Blocker - Action Import Mismatches

**Issue**: Build failing with 24 errors due to import/export mismatches in action files.

**Pattern**: 
- Mutation functions in `@/actions/*.ts` have "Action" suffix (e.g., `createXAction`, `updateXAction`, `deleteXAction`)
- Import sites are missing the "Action" suffix
- Read-only functions (list, get) have NO suffix

**Affected Files Found**:
1. `frontend/src/app/(main)/parametres/marque-blanche/marque-blanche-page-client.tsx` - **FIXED manually**
2. `frontend/src/app/(main)/integrations/woocommerce/woocommerce-page-client.tsx` - **PENDING**

**Action Needed**:
- Systematic search for ALL files importing from `@/actions/*`
- Update imports to use correct "Action" suffix for mutations
- Verify build passes

**Blocker for**: Sidebar refactor work (cannot verify without passing build)


## Import/Export Mismatch Fixes (Completed)

### Issue
Build was failing with missing export errors:
- `Export listWooCommerceConfigs doesn't exist in target module`
- `Export listWooCommerceWebhooks doesn't exist in target module`

### Root Cause
The woocommerce action file exports:
- `getWooCommerceConfigByOrganisation` (not `listWooCommerceConfigs`)
- `listWooCommerceWebhookEvents` (not `listWooCommerceWebhooks`)

But the importing files were using the wrong names.

### Solution Applied
**Files Fixed:**
1. `frontend/src/app/(main)/integrations/woocommerce/page.tsx`
   - Changed import from `listWooCommerceConfigs` to `getWooCommerceConfigByOrganisation`
   - Changed import from `listWooCommerceWebhooks` to `listWooCommerceWebhookEvents`
   - Added `getActiveOrgId()` to get organisation context
   - Updated function calls to pass `organisationId` parameter
   - Wrapped config result in array since it returns single config, not list

2. `frontend/src/app/(main)/integrations/woocommerce/woocommerce-page-client.tsx`
   - Updated imports to match actual exports
   - Added `activeOrgId` prop to component interface
   - Updated fetch functions to pass `organisationId` parameter
   - Updated dependency arrays in useCallback hooks

### Pattern Identified
- Read-only functions (get, list): NO "Action" suffix
- Mutation functions (create, update, delete): HAVE "Action" suffix
- Server components need to get `organisationId` via `getActiveOrgId()`
- Client components receive `organisationId` as prop

### Status
✅ All import/export mismatches fixed
✅ No more "Export doesn't exist" errors
✅ Build now progresses past import/export validation
