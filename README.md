# CRM Microservices Architecture

## Overview

This project implements a **6-service microservices architecture** for CRM (Customer Relationship Management), consolidating 19 original services into 5 highly-optimized backend services.

## Services (5 backend + 1 frontend)

### Consolidated Services

| Service | Ports | Database | Consolidated From |
|---------|-------|----------|-------------------|
| **service-core** | 50052, 50056, 50057 | identity_db | identity + clients + documents |
| **service-commercial** | 50053 | commercial_db | commercial + contrats + products |
| **service-finance** | 50059, 50063, 50068 | postgres-main | factures + payments + calendar |
| **service-engagement** | 50061 | engagement_db | engagement + activites |
| **service-logistics** | 50060 | postgres-main | (standalone) |

### Frontend

| Service | Port | Description |
|---------|------|-------------|
| **frontend** | 3000 | Next.js web application |

## Architecture

- **Framework**: NestJS with gRPC microservices
- **Event Bus**: NATS for async communication
- **Database**: PostgreSQL (4 instances)
- **Protocol Buffers**: Contract-driven architecture
- **Docker**: Containerized deployment

## Consolidation Summary

**Before**: 19 microservices  
**After**: 5 backend services + 1 frontend

### Final Consolidation (Phase 2)

1. **service-core** ← service-identity + service-clients + service-documents
2. **service-commercial** ← service-commercial + service-contrats + service-products
3. **service-finance** ← service-factures + service-payments + service-calendar
4. **service-engagement** ← service-engagement + service-activites
5. **service-logistics** ← (unchanged)

## Development

```bash
# Start all services (recommended for 16GB RAM)
make dev-up-sequential

# Start all services (parallel - requires 32GB+ RAM)
make dev-up

# Run tests for a service
cd services/service-finance && bun test

# Check service status
make dev-ps
```

## Documentation

- [Contract-Driven Architecture](docs/CONTRACT_DRIVEN_ARCHITECTURE.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [Improvements Summary](docs/IMPROVEMENTS_SUMMARY.md)

## License

MIT
