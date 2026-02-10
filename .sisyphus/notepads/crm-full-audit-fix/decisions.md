Notepad initialized

## Task 8: Decisions

1. **ApiClient NOT deleted** — 25 hooks still depend on it. Documented as deferred migration (Waves 4-5). Added comprehensive migration status comment to `lib/api/index.ts`.

2. **Depanssur client FIXED, not deleted** — Has 4 active consumers. Aligned with standard `makeClient/promisify` pattern. Added `depanssur` to SERVICES config at port 50061.

3. **AI health kept as REST** — SSE streaming and browser-side HTTP polling cannot use gRPC. Documented as permanent REST exception with block comments.

4. **use-maileva-auth.ts simplified to re-export** — Since both files now use gRPC (auth handled by gRPC metadata), the auth variant just re-exports from use-maileva.ts.

5. **Auth signup migrated to users.create** — Even though signupAction has zero consumers, migrated the fetch call to gRPC for consistency. The Keycloak registration flow may need revisiting since gRPC doesn't handle password creation.
