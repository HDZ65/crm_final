# NextAuth v4 to v5 Migration Notes

## Date: 2026-02-02

## Changes Made

### 1. Package Update
- `next-auth`: `^4.24.13` -> `5.0.0-beta.30`
- Installed with `--legacy-peer-deps` due to Next.js 16 peer dependency (v5 supports 14-16)

### 2. auth.server.ts
- Replaced `NextAuthOptions` type with `NextAuthConfig`
- Changed from exporting `authOptions` to exporting `{ auth, handlers, signIn, signOut }`
- `getServerSession(authOptions)` replaced with `auth()` function
- Added explicit type annotations for JWT and Session callbacks
- Deprecated `getServerAuth()` in favor of direct `auth()` calls

### 3. Route Handler (app/api/auth/[...nextauth]/route.ts)
```typescript
// Before (v4)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// After (v5)
import { handlers } from "@/lib/auth.server";
export const { GET, POST } = handlers;
```

### 4. Middleware
- Migrated from `getToken()` to `auth()` wrapper pattern
- Session is now accessed via `request.auth` instead of fetching token
- Logic preserved, only implementation changed

### 5. Cookie Names
- `next-auth.session-token` -> `authjs.session-token`
- `next-auth.csrf-token` -> `authjs.csrf-token`
- Updated in `constants.ts`

### 6. Type Declarations
- Simplified `next-auth.d.ts` to use v5 module augmentation pattern
- JWT and Session interfaces remain compatible

## Not Changed
- Keycloak integration logic (keycloak.ts) - unchanged
- Token refresh mechanism - unchanged
- Protected routes logic - unchanged
- Client-side hooks (useSession, signIn, signOut from next-auth/react) - compatible

## Verification
- Build passes: YES
- next-auth version: 5.0.0-beta.30
- LSP diagnostics: clean on all auth files

## Notes for Future
- When next-auth v5 goes stable, update to stable version
- Consider using `authorized` callback in config for middleware instead of custom logic
