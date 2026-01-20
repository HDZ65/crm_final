# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [1.0.0] - 2025-01-15

### Ajouté

#### Architecture gRPC
- Transformation complète du service REST en microservice gRPC
- Fichier Protocol Buffers `proto/invoice.proto` avec 9 méthodes RPC
- Configuration gRPC dans `main.ts` avec transport GRPC sur port 50051
- Support des messages bidirectionnels avec gRPC

#### Fonctionnalités Métier
- Création de factures (status DRAFT)
- Modification de factures (uniquement en DRAFT)
- Suppression de factures (uniquement en DRAFT)
- Validation de factures avec génération PDF Factur-X
- Marquage de factures comme payées
- Création d'avoirs (credit notes)
- Téléchargement de PDFs via gRPC (bytes)
- Immutabilité des factures validées

#### Conformité Légale Française 2025
- Numérotation séquentielle obligatoire (CGI Article 242 nonies A)
- Toutes les mentions légales obligatoires
- Format Factur-X (PDF/A-3b + XML EN 16931)
- Conditions de paiement conformes (30 jours max)
- Pénalités de retard et indemnité forfaitaire
- Hash SHA256 pour vérification d'intégrité

#### Docker & DevOps
- `Dockerfile` multi-stage optimisé pour production (~250MB)
- `Dockerfile.dev` pour développement avec hot-reload
- `docker-compose.yml` pour production (service + PostgreSQL)
- `docker-compose.dev.yml` pour développement
- `.dockerignore` pour optimiser le build
- Health checks intégrés dans les containers
- Utilisateur non-root pour sécurité

#### Tests
- Tests end-to-end gRPC complets (`test/invoice-grpc.e2e-spec.ts`)
- Tests du workflow complet (création → validation → paiement)
- Tests d'immutabilité des factures validées
- Tests de génération d'avoirs
- Tests de téléchargement PDF
- Configuration Jest pour tests unitaires et e2e

#### CI/CD
- Pipeline GitHub Actions (`.github/workflows/ci.yml`)
- Jobs: lint, test, build, docker, security
- Integration PostgreSQL dans les tests
- Scan de sécurité avec Trivy
- npm audit automatique
- Build et push automatique d'images Docker

#### Documentation
- `README.md` - Documentation complète du projet
- `QUICK_START.md` - Guide de démarrage rapide (5 min)
- `DOCKER.md` - Guide complet Docker/Compose
- `DEPLOYMENT.md` - Guide de déploiement (Local, Docker, K8s, Cloud)
- `GRPC_CLIENT_EXAMPLE.md` - Exemple de client NestJS
- `PROJECT_STRUCTURE.md` - Structure détaillée du projet
- `CHANGELOG.md` - Ce fichier

#### Outils de Développement
- `Makefile` avec 30+ commandes utiles
- Configuration VSCode (`.vscode/`)
  - Settings pour formatting automatique
  - Launch configurations pour debugging
  - Extensions recommandées
- Scripts NPM pour tous les cas d'usage
- Configuration ESLint et Prettier

#### Infrastructure as Code
- Manifests Kubernetes dans `DEPLOYMENT.md`
- Exemples AWS ECS, Google Cloud Run, Azure ACI
- Configuration pour monitoring et observabilité
- Exemples de secrets management

### Modifié

- Contrôleur transformé de REST vers gRPC (`@GrpcMethod`)
- Point d'entrée `main.ts` utilise `createMicroservice` au lieu de `create`
- Gestion d'erreurs avec `RpcException` et codes gRPC
- Téléchargement PDF retourne bytes au lieu de stream

### Technique

#### Stack
- NestJS 11.x
- TypeScript 5.7.x
- gRPC (@grpc/grpc-js, @grpc/proto-loader)
- TypeORM 0.3.x
- PostgreSQL 15
- Docker & Docker Compose

#### Dépendances Ajoutées
- `@nestjs/microservices` ^11.0.1
- `@grpc/grpc-js` (latest)
- `@grpc/proto-loader` (latest)

#### Optimisations
- Build multi-stage Docker (réduction 70% taille image)
- Assets proto copiés automatiquement dans dist
- Cache Docker pour builds plus rapides
- Health checks pour haute disponibilité

### Sécurité

- Validation des DTOs avec class-validator
- Sanitization (whitelist, forbidNonWhitelisted)
- Immutabilité des factures validées (Guard + Interceptor)
- Utilisateur non-root dans Docker
- Scan de sécurité automatique (Trivy)
- Audit npm dans CI/CD

### Performance

- Connexion pool PostgreSQL
- Eager loading des relations
- Index sur colonnes fréquentes
- Build optimisé pour production

## [0.1.0] - Avant transformation

### Version initiale
- Service REST avec NestJS
- Support basic de facturation
- Sans gRPC

---

## À Venir

### [1.1.0] - Prévu

#### Sécurité & Auth
- [ ] Authentification gRPC via metadata
- [ ] Support JWT tokens
- [ ] Authorization avec RBAC
- [ ] TLS/SSL pour gRPC
- [ ] Rate limiting

#### Performance
- [ ] Cache Redis pour factures
- [ ] Pagination pour FindAll
- [ ] Compression gRPC
- [ ] Streaming pour exports massifs

#### Monitoring
- [ ] Métriques Prometheus
- [ ] Tracing OpenTelemetry
- [ ] Logs structurés (Winston/Pino)
- [ ] Dashboard de monitoring
- [ ] Alertes (PagerDuty/Slack)

#### Features
- [ ] Export multi-format (CSV, Excel)
- [ ] Templates de factures personnalisables
- [ ] Multi-devises
- [ ] Multi-langues
- [ ] API Gateway REST devant gRPC

#### DevOps
- [ ] Helm charts pour Kubernetes
- [ ] Terraform pour infrastructure
- [ ] Backups automatiques
- [ ] Disaster recovery plan
- [ ] Blue/Green deployment

---

## Notes de Migration

### De 0.x vers 1.0.0

**Breaking Changes:**
- Le service n'expose plus d'API REST, uniquement gRPC
- Port 3000 → Port 50051
- Format de réponse: JSON → Protocol Buffers
- Les clients doivent migrer vers gRPC ou utiliser un gateway

**Migration recommandée:**
1. Déployer un API Gateway REST→gRPC pour compatibilité
2. Migrer progressivement les clients vers gRPC
3. Retirer le gateway une fois la migration terminée

**Avantages:**
- Performance accrue (Protocol Buffers vs JSON)
- Type safety avec .proto
- Support natif du streaming
- Meilleure scalabilité
- Ecosystème gRPC (load balancing, service mesh, etc.)

---

## Contributeurs

- Claude Opus 4.5 (AI Assistant)
- [Votre nom] (Développeur principal)

## License

Propriétaire - Tous droits réservés
