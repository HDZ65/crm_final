# Auth Configuration (Keycloak)

## Keycloak URL and realm
- `KEYCLOAK_ISSUER`: `https://your-keycloak-domain/realms/your-realm`
- `KEYCLOAK_REALM`: `your-realm`

These values are sourced from `.env` and referenced by `frontend/src/lib/auth/keycloak.ts` and `frontend/src/lib/keycloak-admin.ts`.

## JWT algorithm
**HS256**

The gRPC auth interceptor verifies tokens using a shared secret (`JWT_SECRET`) via HMAC (`jose` `jwtVerify` with `TextEncoder().encode(secret)`), which implies a symmetric algorithm (HS256) rather than an asymmetric algorithm (RS256).

### HS256 confirmation
`JWT_SECRET` is required and must match the Keycloak signing key when HS256 is configured. The services expect this shared secret for token verification.

If you switch Keycloak to RS256, the current gRPC verification must be updated to use the realm public key or JWKS instead of `JWT_SECRET`.
