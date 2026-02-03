# CRM Microservices Architecture

## Overview

This project implements a **12-service microservices architecture** for CRM (Customer Relationship Management), consolidating 19 original services into 12 thematic domains.

## Services (12)

### Core Business Services

| Service | Description | Consolidated From |
|---------|-------------|-------------------|
| **service-activites** | Activity and task tracking | - |
| **service-calendar** | Payment batch calendar management | - |
| **service-clients** | Client management with reference data | clients + referentiel |
| **service-commercial** | Sales representatives and commission management | commerciaux + commission |
| **service-contrats** | Contract lifecycle management | - |
| **service-documents** | Document storage and management | - |
| **service-engagement** | Communications hub (email, notifications, dashboards) | email + notifications + dashboard |
| **service-factures** | Invoice generation (Factur-X compliant) | - |
| **service-identity** | User and organization management | users + organisations |
| **service-logistics** | Shipping and logistics (Maileva integration) | - |
| **service-payments** | Payment processing with follow-ups | payments + relance + retry |
| **service-products** | Product catalog and pricing | - |

## Architecture

- **Framework**: NestJS with gRPC microservices
- **Event Bus**: NATS for async communication
- **Database**: PostgreSQL per service
- **Protocol Buffers**: Contract-driven architecture
- **Docker**: Containerized deployment

## Consolidation Summary

**Before**: 19 microservices  
**After**: 12 microservices

### Merged Services

1. **service-engagement** ← service-email + service-notifications + service-dashboard
2. **service-clients** ← service-clients + service-referentiel
3. **service-identity** ← service-users + service-organisations
4. **service-commercial** ← service-commerciaux + service-commission
5. **service-payments** ← service-payments + service-relance + service-retry

## Development

```bash
# Start all services
cd compose/dev && docker compose up -d

# Run tests for a service
cd services/service-payments && bun test

# Build all services
for dir in services/service-*/; do (cd "$dir" && bun run build); done
```

## Documentation

- [Contract-Driven Architecture](docs/CONTRACT_DRIVEN_ARCHITECTURE.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [Improvements Summary](docs/IMPROVEMENTS_SUMMARY.md)

## License

MIT
