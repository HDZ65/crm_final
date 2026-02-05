# Draft: Diagnostic des problèmes de démarrage

## Situation confirmée

### Configuration utilisateur
- **RAM disponible**: 16 GB
- **Ce qu'il essaie de lancer**: Tout le projet (docker compose up)
- **Erreur**: Pas d'erreur claire identifiée

### Architecture du projet
- **12 microservices NestJS + gRPC**
- **4 bases PostgreSQL** (2GB + 3×1GB limits = 5GB)
- **Infrastructure**: NATS, Redis, Consul
- **Frontend**: Next.js 16 avec React 19 (968MB avec node_modules)

### Estimation RAM nécessaire
| Composant | Mémoire |
|-----------|---------|
| 4× PostgreSQL | ~5 GB |
| Redis + NATS + Consul | ~400 MB |
| 12× Microservices | ~3-4 GB |
| Frontend Next.js | ~500 MB - 1 GB |
| Docker Desktop | ~2 GB |
| Windows + IDE | ~5-6 GB |
| **TOTAL** | **~16-20 GB** |

### Diagnostic
**16 GB de RAM est à la LIMITE pour lancer tout le projet en parallèle.**
C'est probablement pour ça que le projet ne démarre pas correctement.

## Solutions existantes découvertes

Le projet a DÉJÀ des commandes pour les systèmes avec peu de RAM :

### Commandes disponibles (make/dev.mk)
1. `make dev-infra-up` - Démarrer JUSTE l'infrastructure
2. `make dev-build-sequential` - Build un service à la fois
3. `make dev-up-sequential` - Démarrer les services séquentiellement
4. `make dev-service-up SERVICE=xxx` - Démarrer un service spécifique

## Options de solution

### Option A: Mode séquentiel complet
```bash
make dev-infra-up
# Attendre que tout soit healthy
make dev-up-sequential
```

### Option B: Mode minimaliste (développement ciblé)
```bash
make dev-infra-up
make dev-service-up SERVICE=service-identity
make dev-service-up SERVICE=service-clients
# Frontend local
cd frontend && bun run dev
```

### Option C: Optimisation Docker Desktop
- Réduire la mémoire allouée à Docker Desktop
- Utiliser WSL2 avec limits

## Open Questions
- Quelle est la commande exacte utilisée pour démarrer ?
- Quelle fonctionnalité veut-il développer ? (pour cibler les services nécessaires)
