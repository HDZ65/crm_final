# Structure Complète du Projet

## Vue d'Ensemble

Ce projet est un **microservice gRPC** de génération de factures conformes à la réglementation française 2025, construit avec NestJS et TypeScript.

## Arborescence Complète

```
service-factures/
│
├── proto/                              # Définitions Protocol Buffers
│   └── invoice.proto                  # Service gRPC et messages
│
├── src/                               # Code source TypeScript
│   ├── modules/                       # Modules NestJS
│   │   ├── invoices/                 # Module principal des factures
│   │   │   ├── dto/
│   │   │   │   ├── create-invoice.dto.ts
│   │   │   │   ├── create-invoice-item.dto.ts
│   │   │   │   └── update-invoice.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── invoice.entity.ts
│   │   │   │   ├── invoice-item.entity.ts
│   │   │   │   └── invoice-status.enum.ts
│   │   │   ├── guards/
│   │   │   │   └── invoice-immutability.guard.ts
│   │   │   ├── invoices.controller.ts    # Contrôleur gRPC
│   │   │   ├── invoices.service.ts       # Logique métier
│   │   │   └── invoices.module.ts
│   │   │
│   │   ├── compliance/               # Module de conformité légale
│   │   │   ├── constants/
│   │   │   │   └── legal-requirements.constant.ts
│   │   │   ├── services/
│   │   │   │   └── legal-mentions.service.ts
│   │   │   └── compliance.module.ts
│   │   │
│   │   └── pdf-generation/           # Module de génération PDF Factur-X
│   │       ├── services/
│   │       │   ├── facturx.service.ts
│   │       │   └── xml-generator.service.ts
│   │       └── pdf-generation.module.ts
│   │
│   ├── common/                       # Code partagé
│   │   ├── decorators/
│   │   │   └── audit-log.decorator.ts
│   │   ├── exceptions/
│   │   │   └── invoice-locked.exception.ts
│   │   └── interceptors/
│   │       └── immutability.interceptor.ts
│   │
│   ├── app.controller.ts             # Contrôleur racine
│   ├── app.service.ts                # Service racine
│   ├── app.module.ts                 # Module racine
│   └── main.ts                       # Point d'entrée gRPC
│
├── storage/                          # Stockage des fichiers
│   ├── pdfs/                        # PDFs générés
│   │   └── .gitkeep
│   └── temp/                        # Fichiers temporaires
│       └── .gitkeep
│
├── test/                            # Tests
│   └── app.e2e-spec.ts
│
├── dist/                            # Code compilé (généré)
│   ├── proto/                       # Proto files copiés
│   ├── modules/
│   ├── common/
│   ├── main.js
│   └── ...
│
├── node_modules/                    # Dépendances (généré)
│
├── .env                            # Configuration locale (gitignored)
├── .env.example                    # Template de configuration
├── .dockerignore                   # Exclusions Docker
├── .gitignore                      # Exclusions Git
├── .mcp.json                       # Configuration MCP
├── .prettierrc                     # Configuration Prettier
│
├── Dockerfile                      # Image de production
├── Dockerfile.dev                  # Image de développement
├── docker-compose.yml              # Compose production
├── docker-compose.dev.yml          # Compose développement
│
├── eslint.config.mjs               # Configuration ESLint
├── nest-cli.json                   # Configuration NestJS CLI
├── package.json                    # Dépendances et scripts
├── package-lock.json               # Lock des dépendances
├── tsconfig.json                   # Configuration TypeScript
├── tsconfig.build.json             # Config build TypeScript
│
├── README.md                       # Documentation principale
├── QUICK_START.md                  # Guide de démarrage rapide
├── DOCKER.md                       # Guide Docker
├── DEPLOYMENT.md                   # Guide de déploiement
├── GRPC_CLIENT_EXAMPLE.md          # Exemple de client gRPC
└── PROJECT_STRUCTURE.md            # Ce fichier
```

## Description des Fichiers Clés

### Configuration

| Fichier | Description |
|---------|-------------|
| `.env.example` | Template des variables d'environnement |
| `nest-cli.json` | Configuration NestJS (assets, build) |
| `tsconfig.json` | Configuration TypeScript |
| `package.json` | Dépendances et scripts npm |

### Protocol Buffers

| Fichier | Description |
|---------|-------------|
| `proto/invoice.proto` | Définition du service gRPC et des messages |

### Code Source

| Dossier/Fichier | Description |
|-----------------|-------------|
| `src/main.ts` | Point d'entrée - Configure le microservice gRPC |
| `src/app.module.ts` | Module racine - Configure TypeORM, modules |
| `src/modules/invoices/` | Module principal - CRUD factures via gRPC |
| `src/modules/compliance/` | Module conformité - Mentions légales |
| `src/modules/pdf-generation/` | Module PDF - Génération Factur-X |
| `src/common/` | Code partagé - Décorateurs, exceptions, interceptors |

### Docker

| Fichier | Description |
|---------|-------------|
| `Dockerfile` | Image multi-stage optimisée pour production |
| `Dockerfile.dev` | Image de développement avec hot-reload |
| `docker-compose.yml` | Stack complète (service + PostgreSQL) |
| `docker-compose.dev.yml` | Stack de développement avec volumes |
| `.dockerignore` | Fichiers exclus de l'image Docker |

### Documentation

| Fichier | Description |
|---------|-------------|
| `README.md` | Documentation complète du projet |
| `QUICK_START.md` | Guide de démarrage en 5 minutes |
| `DOCKER.md` | Guide complet Docker/Compose |
| `DEPLOYMENT.md` | Guide de déploiement (K8s, Cloud) |
| `GRPC_CLIENT_EXAMPLE.md` | Exemple d'utilisation du client |
| `PROJECT_STRUCTURE.md` | Structure du projet (ce fichier) |

## Flux de Données

```
┌─────────────────┐
│  Client gRPC    │
│  (App externe)  │
└────────┬────────┘
         │
         │ gRPC Request (port 50051)
         │
         ▼
┌─────────────────────────────────────┐
│   Microservice Invoice (NestJS)     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  InvoicesController (gRPC)    │ │
│  │  @GrpcMethod decorators       │ │
│  └────────────┬──────────────────┘ │
│               │                     │
│               ▼                     │
│  ┌───────────────────────────────┐ │
│  │  InvoicesService              │ │
│  │  (Business Logic)             │ │
│  └─────┬──────────────┬──────────┘ │
│        │              │             │
│        ▼              ▼             │
│  ┌─────────┐    ┌─────────────┐   │
│  │TypeORM  │    │ PDF/Factur-X│   │
│  │Entities │    │  Generation │   │
│  └────┬────┘    └──────┬──────┘   │
└───────┼─────────────────┼──────────┘
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │  Storage/    │
│  Database    │   │  PDFs/       │
└──────────────┘   └──────────────┘
```

## Scripts NPM

```json
{
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

## Ports Utilisés

| Service | Port | Description |
|---------|------|-------------|
| gRPC Server | 50051 | Port du microservice gRPC |
| PostgreSQL | 5432 | Base de données |

## Dépendances Principales

### Production

| Package | Version | Utilisation |
|---------|---------|-------------|
| `@nestjs/core` | ^11.0.1 | Framework NestJS |
| `@nestjs/microservices` | ^11.0.1 | Support gRPC |
| `@grpc/grpc-js` | latest | Client/Server gRPC |
| `@grpc/proto-loader` | latest | Chargement fichiers .proto |
| `@nestjs/typeorm` | ^11.0.0 | ORM pour PostgreSQL |
| `typeorm` | ^0.3.28 | ORM TypeScript |
| `class-validator` | ^0.14.3 | Validation des DTOs |
| `class-transformer` | ^0.5.1 | Transformation des données |
| `dayjs` | ^1.11.19 | Manipulation de dates |
| `fast-xml-parser` | ^5.3.3 | Génération XML Factur-X |

### Développement

| Package | Version | Utilisation |
|---------|---------|-------------|
| `@nestjs/cli` | ^11.0.0 | CLI NestJS |
| `typescript` | ^5.7.3 | Compilateur TypeScript |
| `eslint` | ^9.18.0 | Linter |
| `prettier` | ^3.4.2 | Formatage de code |
| `jest` | ^30.0.0 | Tests unitaires |
| `ts-jest` | ^29.2.5 | Jest pour TypeScript |

## Variables d'Environnement

### Obligatoires

```env
DB_HOST                    # Hôte PostgreSQL
DB_PORT                    # Port PostgreSQL
DB_USERNAME                # Utilisateur PostgreSQL
DB_PASSWORD                # Mot de passe PostgreSQL
DB_DATABASE                # Nom de la base de données
GRPC_URL                   # URL d'écoute gRPC (ex: 0.0.0.0:50051)
COMPANY_NAME               # Nom de l'entreprise
COMPANY_SIRET              # SIRET (14 chiffres)
COMPANY_SIREN              # SIREN (9 chiffres)
COMPANY_TVA                # Numéro TVA intracommunautaire
COMPANY_RCS                # Immatriculation RCS
COMPANY_CAPITAL            # Capital social
COMPANY_ADDRESS            # Adresse complète
COMPANY_EMAIL              # Email de contact
COMPANY_PHONE              # Téléphone
```

### Optionnelles

```env
NODE_ENV                   # development | production
INVOICE_PREFIX             # Préfixe des numéros de facture (défaut: INV)
INVOICE_YEAR_RESET         # true | false (défaut: true)
PDF_STORAGE_PATH           # Chemin de stockage PDFs
PDF_TEMP_PATH              # Chemin des fichiers temporaires
```

## Fonctionnalités par Module

### Module Invoices

- ✅ Création de factures (DRAFT)
- ✅ Modification (seulement si DRAFT)
- ✅ Suppression (seulement si DRAFT)
- ✅ Validation (génère PDF, bloque modifications)
- ✅ Marquage comme payée
- ✅ Création d'avoirs (credit notes)
- ✅ Téléchargement du PDF Factur-X

### Module Compliance

- ✅ Vérification des mentions légales obligatoires
- ✅ Numérotation séquentielle automatique
- ✅ Validation des informations entreprise
- ✅ Calcul des pénalités de retard conformes

### Module PDF Generation

- ✅ Génération PDF/A-3b
- ✅ Intégration XML EN 16931 (Factur-X)
- ✅ Hash SHA256 pour intégrité
- ✅ Format conforme aux normes européennes

## Points d'Extension

### Ajout d'une Nouvelle Méthode gRPC

1. Modifier `proto/invoice.proto`
2. Ajouter la méthode dans `InvoicesController`
3. Implémenter la logique dans `InvoicesService`
4. Rebuild et redéployer

### Ajout d'un Nouveau Module

```bash
nest generate module modules/my-module
nest generate service modules/my-module
nest generate controller modules/my-module
```

### Intégration avec d'Autres Services

Le microservice peut communiquer avec d'autres services via :
- gRPC (natif)
- Message queues (NATS, RabbitMQ, Kafka)
- HTTP (via @nestjs/axios)

## Sécurité

### Implémentée

- ✅ Validation des entrées (class-validator)
- ✅ Sanitization (whitelist, forbidNonWhitelisted)
- ✅ Immutabilité des factures validées
- ✅ Utilisateur non-root dans Docker
- ✅ Multi-stage build (image légère)

### À Implémenter

- ⏳ Authentification gRPC (metadata, JWT)
- ⏳ Autorisation (RBAC)
- ⏳ TLS/SSL pour gRPC
- ⏳ Rate limiting
- ⏳ Chiffrement des données sensibles

## Performance

### Optimisations Actuelles

- Connexion pool PostgreSQL (TypeORM)
- Build multi-stage Docker (image ~250MB)
- Eager loading des relations (items)
- Indexes sur les colonnes fréquemment requêtées

### Optimisations Possibles

- Cache Redis pour les factures fréquemment lues
- Pagination des résultats (FindAll)
- Compression gRPC
- CDN pour les PDFs

## Monitoring & Observabilité

### À Implémenter

- Logs structurés (Winston, Pino)
- Métriques Prometheus
- Tracing distribué (OpenTelemetry)
- Health checks détaillés
- Alertes (PagerDuty, Slack)

## Backups

### Données Critiques

1. **Base de données PostgreSQL**
   - Backups automatiques quotidiens
   - Rétention 30 jours
   - Test de restore mensuel

2. **PDFs générés**
   - Stockage persistent (volume Docker)
   - Backup vers S3/GCS
   - Archive long-terme

## Conformité & Légal

### Normes Respectées

- ✅ CGI Article 242 nonies A (numérotation)
- ✅ Mentions obligatoires 2025
- ✅ Format Factur-X (PDF/A-3 + XML EN 16931)
- ✅ Conditions de paiement (30 jours max)
- ✅ Pénalités de retard conformes

### Audit Trail

- Tous les changements de statut sont tracés
- Timestamps automatiques (createdAt, updatedAt)
- Hash SHA256 pour vérifier l'intégrité des PDFs

## Support

Pour toute question :
1. Consulter la documentation dans les fichiers .md
2. Vérifier les logs : `docker-compose logs -f`
3. Tester avec grpcurl
4. Consulter les issues GitHub

---

**Version**: 1.0.0
**Dernière mise à jour**: 2025-01-15
**Licence**: Propriétaire
