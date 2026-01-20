# Security Guide - CRM Final

This document outlines the security measures, best practices, and important security considerations for the CRM Final project.

## Table of Contents

1. [Environment Variables & Secrets](#environment-variables--secrets)
2. [Database Security](#database-security)
3. [gRPC Communication Security](#grpc-communication-security)
4. [Authentication & Authorization](#authentication--authorization)
5. [Deployment Checklist](#deployment-checklist)
6. [Security Incident Response](#security-incident-response)

---

## Environment Variables & Secrets

### Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets:**
   ```bash
   # Generate Keycloak secret
   echo "KEYCLOAK_SECRET=$(openssl rand -base64 32)" >> .env
   
   # Generate NextAuth secret
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
   
   # Generate encryption key for sensitive data
   echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
   ```

3. **Never commit `.env` files:**
   - The `.env` file is gitignored by default
   - Only `.env.example` should be committed (without actual values)

### Critical Environment Variables

| Variable | Purpose | Security Level |
|----------|---------|----------------|
| `KEYCLOAK_SECRET` | OAuth2 client secret | 🔴 CRITICAL |
| `NEXTAUTH_SECRET` | JWT signing key | 🔴 CRITICAL |
| `ENCRYPTION_KEY` | AES-256-GCM encryption | 🔴 CRITICAL |
| `DB_PASSWORD` | Database password | 🔴 CRITICAL |

### Production Deployment

For production, use:
- **Docker Secrets** for sensitive values
- **AWS Secrets Manager** / **Azure Key Vault** / **Google Secret Manager**
- **Kubernetes Secrets** (sealed secrets recommended)

**Example with Docker Secrets:**
```yaml
# docker-compose.prod.yml
services:
  frontend:
    environment:
      KEYCLOAK_SECRET: /run/secrets/keycloak_secret
    secrets:
      - keycloak_secret

secrets:
  keycloak_secret:
    external: true
```

---

## Database Security

### SSL/TLS Configuration

**Development:**
- SSL is disabled by default for local PostgreSQL
- If `DB_SSL=true`, certificate validation is lenient

**Production:**
- SSL MUST be enabled with proper certificate validation
- Set `NODE_ENV=production` to enforce `rejectUnauthorized: true`

**Configuration in services:**
```typescript
ssl: configService.get<string>('DB_SSL') === 'true'
  ? {
      rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production',
      // Optional: Provide CA certificate
      // ca: fs.readFileSync('/path/to/ca-cert.pem'),
    }
  : false,
```

### Database Credentials

- Use strong passwords (minimum 16 characters)
- Rotate passwords regularly
- Use separate credentials per environment
- Never use default `postgres/postgres` in production

### Sensitive Data Encryption

Sensitive fields are encrypted at rest using AES-256-GCM:

**Encrypted fields:**
- Email mailbox passwords (`service-email`)
- OAuth tokens (access tokens, refresh tokens)
- Payment provider credentials
- Carrier account credentials

**Encryption Service:**
Located in `services/service-email/src/common/encryption.service.ts`

```typescript
// Uses AES-256-GCM with:
// - 32-byte keys
// - 16-byte random IVs
// - Authentication tags for tamper detection
```

---

## gRPC Communication Security

### Current Status (Development)

⚠️ **WARNING:** All gRPC connections currently use `credentials.createInsecure()`

This is **ACCEPTABLE for development** but **CRITICAL to change for production**.

### Production gRPC Security

**Option 1: TLS with System Certificates (Recommended)**
```typescript
// frontend/src/lib/grpc/index.ts
import { credentials } from '@grpc/grpc-js';

const getSecureCredentials = () => {
  if (process.env.NODE_ENV === 'production') {
    return credentials.createSsl();
  }
  return credentials.createInsecure();
};

export const clientBaseInstance = new ClientBaseServiceClient(
  SERVICES.clients,
  getSecureCredentials()
);
```

**Option 2: Mutual TLS (mTLS)**
```typescript
import * as fs from 'fs';

const tlsCreds = credentials.createSsl(
  fs.readFileSync('/path/to/ca.pem'),
  fs.readFileSync('/path/to/client-key.pem'),
  fs.readFileSync('/path/to/client-cert.pem')
);

export const clientBaseInstance = new ClientBaseServiceClient(
  SERVICES.clients,
  tlsCreds
);
```

**Option 3: Service Mesh (Istio/Linkerd)**
- Automatically handles mTLS between services
- Centralized certificate management
- Recommended for production Kubernetes deployments

### gRPC Authentication

**TODO: Implement gRPC metadata authentication**

Current services have NO authentication on gRPC endpoints. Implement this guard:

```typescript
// shared/guards/grpc-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata: Metadata = context.getArgByIndex(1);
    const authHeader = metadata.get('authorization')[0];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Missing authorization token'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Validate JWT with Keycloak
    const user = await this.validateKeycloakToken(token);
    
    // Attach user context to request
    const request = context.switchToRpc().getData();
    request.userId = user.sub;
    request.organisationId = user.organisationId;
    
    return true;
  }
  
  private async validateKeycloakToken(token: string): Promise<any> {
    // Implement Keycloak JWT validation
    // Use jsonwebtoken + jwks-rsa
  }
}
```

**Apply to all controllers:**
```typescript
@Controller()
@UseGuards(GrpcAuthGuard)
export class ClientsController {
  // All gRPC methods now require valid JWT
}
```

---

## Authentication & Authorization

### Frontend (NextAuth + Keycloak)

**Current Implementation:**
- ✅ Keycloak OAuth2 integration
- ✅ JWT-based session management
- ✅ Token refresh mechanism
- ✅ Middleware route protection

**Protected Routes:**
All routes except `/login`, `/signup`, `/reset-password` require authentication.

**Middleware:** `/home/alex/crm_final/frontend/src/middleware.ts`

### Backend Services

**Current Status:**
- ❌ No authentication on gRPC endpoints
- ❌ No RBAC (Role-Based Access Control)
- ⚠️ Only multi-tenancy via `organisationId` in requests

**Required Implementation:**
1. Add `GrpcAuthGuard` to all services
2. Implement RBAC decorators (port from `_backup/backend`)
3. Enforce tenant isolation at database level

---

## Deployment Checklist

### Before Production Deployment

- [ ] Generate new production secrets (Keycloak, NextAuth, Encryption)
- [ ] Enable SSL/TLS for all database connections
- [ ] Implement gRPC TLS for all service-to-service communication
- [ ] Add gRPC authentication guards to all services
- [ ] Configure CORS properly (no wildcards)
- [ ] Enable rate limiting on all endpoints
- [ ] Set up WAF (Web Application Firewall)
- [ ] Configure CSP headers (Content Security Policy)
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Set up DDoS protection
- [ ] Configure logging and monitoring (no sensitive data in logs)
- [ ] Set up automated security scanning (Snyk, Dependabot)
- [ ] Perform penetration testing
- [ ] Set up incident response plan
- [ ] Enable audit logging for all sensitive operations

### Environment-Specific Security

**Development:**
```env
NODE_ENV=development
DB_SSL=false
CORS_ORIGIN=http://localhost:3000
```

**Production:**
```env
NODE_ENV=production
DB_SSL=true
CORS_ORIGIN=https://app.yourcrm.com
RATE_LIMIT_ENABLED=true
```

---

## Security Incident Response

### If You Suspect a Security Breach

1. **Immediate Actions:**
   - Rotate all secrets immediately
   - Review access logs
   - Disable compromised accounts
   - Notify security team

2. **Investigation:**
   - Check audit logs in `service-payments` (portal sessions)
   - Review database access logs
   - Analyze gRPC request patterns

3. **Communication:**
   - Notify affected users
   - Document incident timeline
   - Prepare incident report

### Reporting Security Issues

**Do NOT create public GitHub issues for security vulnerabilities.**

Contact: security@yourcompany.com

---

## Security Best Practices for Developers

1. **Never commit secrets** - Use `.env` files (gitignored)
2. **Validate all inputs** - Use DTOs with class-validator
3. **Use parameterized queries** - TypeORM does this by default
4. **Sanitize user input** - Especially for search queries
5. **Implement RBAC** - Not just authentication, but authorization too
6. **Log security events** - Failed auth, privilege escalation attempts
7. **Use HTTPS everywhere** - No mixed content
8. **Keep dependencies updated** - Run `npm audit` regularly
9. **Implement rate limiting** - Prevent brute force and DoS
10. **Follow principle of least privilege** - Services should only access what they need

---

## Recent Security Fixes (January 2026)

### ✅ Completed

1. **Removed hardcoded secrets from docker-compose.yml**
   - Replaced with environment variable references
   - Created `.env.example` template

2. **Fixed SSL certificate validation**
   - Changed `rejectUnauthorized: false` to environment-aware
   - Production now enforces certificate validation

3. **Removed committed .env file**
   - Removed `services/service-calendar/.env` from git history

4. **Updated .gitignore**
   - Added explicit `.env` patterns

### ⚠️ Pending (High Priority)

1. **Implement gRPC TLS** - All services
2. **Add gRPC authentication** - JWT validation
3. **Enable rate limiting** - All endpoints
4. **Implement RBAC** - Role-based access control

---

**Last Updated:** January 20, 2026  
**Security Team:** CRM Development Team  
**Next Review:** February 2026
