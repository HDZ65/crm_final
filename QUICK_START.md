# 🚀 Guide de Démarrage Rapide - CRM Microservices

## ⚡ Démarrage en Une Commande

```bash
make dev-up-sequential
```

Cette commande démarre **tout le projet** (infrastructure + 5 services + frontend) de manière optimisée pour les systèmes avec 16 GB de RAM.

---

## 📋 Prérequis

- **Docker Desktop** installé et lancé
- **Bun** installé (ou npm en fallback)
- **16 GB RAM minimum** recommandé
- **Windows/WSL2** ou Linux/macOS

---

## 🎯 Commandes Essentielles

### Démarrage
```bash
# Démarrer tout (mode séquentiel - recommandé pour 16GB RAM)
make dev-up-sequential

# Démarrer tout (mode parallèle - nécessite 32GB+ RAM)
make dev-up

# Démarrer uniquement l'infrastructure
make dev-infra-up
```

### Gestion
```bash
# Voir l'état des services
make dev-ps

# Voir les logs de tous les services
make dev-logs

# Voir les logs d'un service spécifique
make dev-service-logs SERVICE=service-core

# Vérifier la santé des services
make dev-health-check
```

### Arrêt
```bash
# Arrêter tous les services
make dev-down

# Nettoyer complètement (supprime volumes)
make dev-clean
```

---

## 🌐 Accès aux Services

Une fois démarré, accédez à :

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface Next.js |
| **NATS Monitoring** | http://localhost:8222 | Monitoring NATS |
| **Consul UI** | http://localhost:8500 | Service discovery |
| **gRPC Services** | localhost:50051-50070 | Microservices |

---

## 🔧 Développement

### Développer sur un service spécifique

```bash
# Démarrer l'infrastructure
make dev-infra-up

# Démarrer un service en local (hot-reload)
cd services/service-core
bun run start:dev
```

### Développer sur le frontend

```bash
# Démarrer l'infrastructure + services backend
make dev-up-sequential

# Ou juste l'infra si tu veux les services en local
make dev-infra-up

# Frontend en local (hot-reload)
cd frontend
bun run dev
```

---

## 🐛 Dépannage

### Le projet ne démarre pas

1. **Vérifier Docker Desktop** :
   ```bash
   docker info
   ```

2. **Nettoyer le cache Docker** :
   ```bash
   make dev-clean
   docker system prune -f
   ```

3. **Relancer en mode séquentiel** :
   ```bash
   make dev-up-sequential
   ```

### Un service crash

1. **Voir les logs** :
   ```bash
   make dev-service-logs SERVICE=service-core
   ```

2. **Redémarrer le service** :
   ```bash
   make dev-service-restart SERVICE=service-core
   ```

### Problème de RAM

Si tu manques de RAM, utilise le **mode minimaliste** :

```bash
# Démarrer uniquement l'infrastructure
make dev-infra-up

# Démarrer 2-3 services essentiels
make dev-service-up SERVICE=service-core
make dev-service-up SERVICE=service-engagement

# Frontend en local
cd frontend && bun run dev
```

---

## 📊 Architecture

### Services (5 backend + frontend)

| Service | Ports | Description |
|---------|-------|-------------|
| service-core | 50052, 50056, 50057 | Users, Clients, Documents (Identity + Clients + Documents) |
| service-commercial | 50053 | Commerciaux, Contrats, Produits |
| service-finance | 50059, 50063, 50068 | Factures, Paiements, Calendrier |
| service-engagement | 50061 | Email, Notifications, Dashboard, Activités |
| service-logistics | 50060 | Expédition (Maileva) |
| frontend | 3000 | Interface Next.js |

### Infrastructure

- **PostgreSQL** (4 instances) : identity_db, commercial_db, engagement_db, postgres-main
- **NATS** : Event bus
- **Redis** : Cache
- **Consul** : Service discovery

---

## 🎓 En Savoir Plus

- [README.md](README.md) - Vue d'ensemble du projet
- [docs/CONTRACT_DRIVEN_ARCHITECTURE.md](docs/CONTRACT_DRIVEN_ARCHITECTURE.md) - Architecture gRPC
- [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) - Guide de migration
- [frontend/CLAUDE.md](frontend/CLAUDE.md) - Documentation frontend

---

## ✅ Checklist Premier Démarrage

- [ ] Docker Desktop lancé
- [ ] Bun installé (`bun --version`)
- [ ] Cloner le repo
- [ ] Lancer `make dev-up-sequential`
- [ ] Attendre 5-7 minutes (première fois)
- [ ] Vérifier http://localhost:3000
- [ ] Consulter les logs : `make dev-logs`

---

**Besoin d'aide ?** Consulte le rapport de diagnostic dans `.sisyphus/notepads/fix-startup-issues/final-report.md`
