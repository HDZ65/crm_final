# Decisions — catalogue-api-auth-fix

## [2026-02-12T11:26:31Z] Scope Decisions
- Bearer token scheme (not API key or Basic auth)
- Token is ephemeral (not persisted)
- Use `authToken?.trim()` guard to prevent empty Bearer header
- State name: `showCatalogueToken` (not `showApiToken` which conflicts with WLP)
- 401 error gets Keycloak-specific message
