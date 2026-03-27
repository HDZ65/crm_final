# 🚀 Guide de Démarrage Rapide - CRM Gestion

## Workflow complet

### 🆕 Première fois (après clone du projet) :
```bash
# 1. Initialiser le projet (protos + BDD + migrations)
make init

# 2. Démarrer l'environnement
make start
```

### 📅 Usage quotidien :
```bash
# Pour DÉMARRER tout le système
make start

# Pour ARRÊTER tout le système
make stop
```

### 🔄 Après modification des protos ou ajout de migrations :
```bash
# Mettre à jour protos et migrations
make update
```

---

## 📊 Détail des commandes

### `make init` - Initialisation complète
- ✅ Génère les fichiers Proto
- ✅ Démarre PostgreSQL
- ✅ Crée toutes les bases de données (core, commercial, finance, etc.)
- ✅ Lance les migrations initiales

### `make start` - Démarrage
- ✅ Infrastructure (PostgreSQL, Redis, NATS, Consul)
- ✅ Keycloak (Authentification)
- ✅ 7 Services Backend
- ✅ Frontend Next.js

### `make stop` - Arrêt propre
- ✅ Arrête tout dans l'ordre inverse
- ✅ Préserve les données (volumes Docker)

### `make update` - Mise à jour
- ✅ Régénère les fichiers Proto
- ✅ Redémarre les services
- ✅ Execute les nouvelles migrations

---

## 🔗 Accès aux services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3400 | - |
| **Keycloak Admin** | http://localhost:3402 | admin / admin |
| **Consul UI** | http://localhost:3406 | - |
| **PostgreSQL** | localhost:3401 | postgres / postgres |
| **Redis** | localhost:3403 | - |
| **NATS Monitor** | http://localhost:3405 | - |

---

## 🛠️ Autres commandes utiles

```bash
# Voir les logs de tous les services
make logs

# Voir l'état des containers
make ps

# Redémarrer tout
make restart

# Nettoyer les volumes (⚠️ supprime les données)
make clean

# Générer seulement les protos
make proto-generate

# Lancer seulement les migrations
make migrate-all
```

## 📝 Commandes avancées par service

```bash
# Service Core
make service-core-up      # Démarrer
make service-core-logs     # Logs
make service-core-migrate  # Migrations

# Frontend
make frontend-up          # Démarrer
make frontend-logs        # Logs
make frontend-build       # Rebuild

# Infrastructure
make dev-infra-up         # Démarrer infra seule
make consul-status        # État de Consul
make nats-status          # État de NATS
```

---

## ⚡ Tips & Troubleshooting

### Premier démarrage
1. `make init` (une seule fois)
2. Attendre ~30 secondes que tout démarre
3. Vérifier avec `make ps` que tout est "healthy"

### Problèmes courants
- **Services ne démarrent pas** : `make restart`
- **Erreurs de proto** : `make update`
- **Base de données vide** : `make init` puis `make start`
- **Ports déjà utilisés** : Vérifier qu'aucun autre projet ne tourne

### Performance
- Les services mettent ~30 secondes à être totalement opérationnels
- PostgreSQL doit être "ready" avant les migrations
- Le frontend compile au premier accès (~10 secondes)