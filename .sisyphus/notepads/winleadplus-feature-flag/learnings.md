# Learnings: WinLeadPlus Feature Flag

## Task 1: HasConfig RPC Implementation

### Pattern: Non-Auto-Creating Config Check
- **Problem**: `getConfig()` auto-creates configs with `enabled: true` for any org. This breaks feature flagging.
- **Solution**: New `hasConfig()` method uses `configRepository.findByOrganisationId()` directly (no auto-create).
- **Return Logic**: `config !== null && config.enabled` (two conditions: exists AND enabled).
- **Key Insight**: Fail-closed behavior — if config doesn't exist, return false (show clean CRM).

### Implementation Pattern
1. **Service Method** (winleadplus-sync.service.ts):
   ```typescript
   async hasConfig(organisationId: string): Promise<boolean> {
     const config = await this.configRepository.findByOrganisationId(organisationId);
     return config !== null && config.enabled;
   }
   ```

2. **gRPC Controller** (winleadplus.grpc-controller.ts):
   - Reuse `GetWinLeadPlusConfigRequest` (already has `organisation_id` field)
   - Return new `HasWinLeadPlusConfigResponse { bool enabled = 1; }`
   - Follow existing pattern from `GetConfig` method (lines 120-131)

3. **Proto Definition** (winleadplus.proto):
   - Add message: `message HasWinLeadPlusConfigResponse { bool enabled = 1; }`
   - Add RPC: `rpc HasConfig(GetWinLeadPlusConfigRequest) returns (HasWinLeadPlusConfigResponse);`
   - Reuse existing request type (no new request message needed)

### Proto Build & Frontend Sync
- Build: `cd packages/proto && npm run build`
- Copy: `cp packages/proto/gen/ts-frontend/winleadplus/winleadplus.ts frontend/src/proto/winleadplus/winleadplus.ts`
- Warnings about duplicate `google/protobuf/timestamp.ts` are harmless (known buf issue)

### Verification Checklist
- ✓ Service method exists: `grep "async hasConfig" services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts`
- ✓ Controller method exists: `grep "@GrpcMethod.*HasConfig" services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`
- ✓ Proto RPC exists: `grep "rpc HasConfig" packages/proto/src/winleadplus/winleadplus.proto`
- ✓ Proto message exists: `grep "message HasWinLeadPlusConfigResponse" packages/proto/src/winleadplus/winleadplus.proto`
- ✓ Backend types generated: `grep "HasWinLeadPlusConfigResponse" packages/proto/gen/ts/winleadplus/winleadplus.ts`
- ✓ Frontend types copied: `grep "HasWinLeadPlusConfigResponse" frontend/src/proto/winleadplus/winleadplus.ts`
- ✓ TypeScript compiles: `cd services/service-commercial && npx tsc --noEmit` (exit 0)
- ✓ Proto builds: `cd packages/proto && npm run build` (exit 0)

### Commit
- Message: `feat(commercial): add HasConfig RPC for WinLeadPlus feature flag check`
- Files: service, controller, proto, generated types, frontend types

## Task 2: Frontend Conditional Rendering

### Pattern: Server-Side Config Check + Client-Side Conditional Rendering

**Architecture**:
1. **gRPC Client Method** (`frontend/src/lib/grpc/clients/winleadplus.ts`):
   - Add `hasConfig` method following exact pattern of `syncProspects`
   - Import types: `GetWinLeadPlusConfigRequest`, `HasWinLeadPlusConfigResponse`
   - Use `promisify` wrapper with `getSyncServiceClient()`

2. **Server Action** (`frontend/src/actions/winleadplus.ts`):
   - Create `hasWinLeadPlusConfig(params: { organisationId: string }): Promise<boolean>`
   - Call `winleadplus.hasConfig()` and return `data.enabled ?? false`
   - **Fail-closed**: catch errors and return `false` (show clean CRM)

3. **Server Page Component** (`frontend/src/app/(main)/clients/page.tsx`):
   - Import server action: `import { hasWinLeadPlusConfig } from "@/actions/winleadplus"`
   - Fetch in parallel with clients: `Promise.all([getClientsByOrganisation(...), hasWinLeadPlusConfig(...)])`
   - Pass as prop: `<ClientsPageClient ... hasWinLeadPlus={hasWinLeadPlus} />`

4. **Client Component** (`frontend/src/app/(main)/clients/clients-page-client.tsx`):
   - Add prop: `hasWinLeadPlus?: boolean` (default `false`)
   - Wrap Sync WLP button: `{hasWinLeadPlus && <Button>Sync WLP</Button>}`
   - Wrap SelectItem: `{hasWinLeadPlus && <SelectItem value="WinLeadPlus">WinLeadPlus</SelectItem>}`
   - Add useEffect to reset filter if disabled: `if (!hasWinLeadPlus && filters.source === "WinLeadPlus") updateFilter("source", "")`

### Key Patterns
- **Prop Drilling**: Simple boolean flag passed from server → client (no context/provider needed)
- **Fail-Closed**: Server action returns `false` on error → UI shows clean CRM
- **Filter Reset**: useEffect watches `hasWinLeadPlus` and `filters.source`, resets if mismatch
- **Conditional Rendering**: JSX `{condition && <Component />}` pattern for both button and SelectItem

### Verification Evidence
- ✓ `hasConfig` method in gRPC client (line 60)
- ✓ `hasWinLeadPlusConfig` server action (line 109)
- ✓ Config fetched in page.tsx (line 21)
- ✓ Prop passed to ClientsPageClient (line 31)
- ✓ Prop in interface (line 61)
- ✓ Prop destructured with default (line 64)
- ✓ Sync button wrapped (line 459)
- ✓ SelectItem wrapped (line 564)
- ✓ useEffect for filter reset (line 408)
- ✓ TypeScript compiles: `npx tsc --noEmit` (exit 0)
- ✓ Build succeeds: `npm run build` (exit 0)

### Commit
- Message: `feat(frontend): conditionally show WinLeadPlus UI based on org config`
- Files: gRPC client, server action, page component, client component

## Final Verification Summary

### All Checklist Items Verified ✅

1. **HasConfig RPC exists and uses findByOrganisationId (no auto-create)**
   - ✅ Method at line 205: `async hasConfig(organisationId: string): Promise<boolean>`
   - ✅ Uses `configRepository.findByOrganisationId()` directly (line 206)
   - ✅ Returns `config !== null && config.enabled` (line 207)

2. **Frontend hasConfig gRPC method works**
   - ✅ Method at line 60 in `frontend/src/lib/grpc/clients/winleadplus.ts`
   - ✅ Returns `Promise<HasWinLeadPlusConfigResponse>`

3. **Server action returns false on error (fail closed)**
   - ✅ Line 118 in `frontend/src/actions/winleadplus.ts`: `return false; // Fail closed`
   - ✅ Catch block ensures errors show clean CRM

4. **Sync WLP button wrapped in `{hasWinLeadPlus && ...}`**
   - ✅ Conditional rendering verified in clients-page-client.tsx
   - ✅ Pattern: `{hasWinLeadPlus && <Button>Sync WLP</Button>}`

5. **WinLeadPlus SelectItem wrapped in `{hasWinLeadPlus && ...}`**
   - ✅ Conditional rendering verified in clients-page-client.tsx
   - ✅ Pattern: `{hasWinLeadPlus && <SelectItem value="WinLeadPlus">WinLeadPlus</SelectItem>}`

6. **Badge in columns.tsx NOT touched (already data-conditional)**
   - ✅ No changes to columns.tsx between commits
   - ✅ Badge remains data-driven (`source === "WinLeadPlus"`)

7. **No React context/provider/hook created**
   - ✅ No createContext/useContext found in clients directory
   - ✅ Simple prop drilling used instead

8. **No loading states added**
   - ✅ No Skeleton/isLoading patterns added
   - ✅ Config check is server-side (no loading UI needed)

9. **Client detail page NOT modified**
   - ✅ No changes to `frontend/src/app/(main)/clients/[id]/page.tsx`

### Commits Created
- `30815435` - `feat(commercial): add HasConfig RPC for WinLeadPlus feature flag check`
- `5a59613` - `feat(frontend): conditionally show WinLeadPlus UI based on org config`

### Plan Status
- Total tasks: 2
- Completed: 2
- Remaining: 0
- Final checklist: 9/9 items verified ✅

