# Guide Docker - Microservice gRPC Factures

Ce guide explique comment utiliser Docker et Docker Compose pour déployer le microservice de facturation.

## Prérequis

- Docker >= 20.10
- Docker Compose >= 2.0

## Fichiers Docker

- `Dockerfile` - Image de production optimisée (multi-stage build)
- `Dockerfile.dev` - Image de développement avec hot-reload
- `docker-compose.yml` - Configuration de production
- `docker-compose.dev.yml` - Configuration de développement
- `.dockerignore` - Fichiers à exclure de l'image

## Démarrage Rapide

### Mode Développement

Démarrez le service avec hot-reload et PostgreSQL :

```bash
docker-compose -f docker-compose.dev.yml up
```

Le service sera accessible sur `localhost:50051` avec hot-reload activé.

Pour reconstruire l'image après modification du package.json :

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Mode Production

Démarrez le service en mode production :

```bash
docker-compose up -d
```

Vérifier les logs :

```bash
docker-compose logs -f invoice-service
```

Arrêter les services :

```bash
docker-compose down
```

## Commandes Utiles

### Construire l'Image

```bash
# Production
docker build -t invoice-service:latest .

# Développement
docker build -f Dockerfile.dev -t invoice-service:dev .
```

### Exécuter le Container

```bash
# Production
docker run -d \
  --name invoice-service \
  -p 50051:50051 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=invoices_db \
  invoice-service:latest

# Développement avec volume monté
docker run -d \
  --name invoice-service-dev \
  -p 50051:50051 \
  -v $(pwd):/app \
  -v /app/node_modules \
  invoice-service:dev
```

### Voir les Logs

```bash
# Tous les services
docker-compose logs -f

# Seulement le service de facturation
docker-compose logs -f invoice-service

# Dernières 100 lignes
docker-compose logs --tail=100 invoice-service
```

### Accéder au Shell du Container

```bash
# Via docker-compose
docker-compose exec invoice-service sh

# Via docker
docker exec -it invoice-service sh
```

### Gérer les Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect service-factures_postgres_data

# Supprimer tous les volumes (⚠️ supprime les données)
docker-compose down -v
```

## Structure de l'Image

### Image de Production

L'image de production utilise un build multi-stage :

1. **Stage Builder** :
   - Installe toutes les dépendances
   - Compile le code TypeScript
   - Nettoie les devDependencies

2. **Stage Production** :
   - Image légère basée sur Alpine
   - Utilisateur non-root (nestjs:1001)
   - Seulement les fichiers nécessaires
   - Health check intégré

**Taille de l'image** : ~250MB (vs ~800MB sans multi-stage)

### Image de Développement

- Inclut toutes les dépendances (dev)
- Support du hot-reload via volumes
- Pas d'optimisation de taille

## Variables d'Environnement

Les variables peuvent être définies :

1. Dans `docker-compose.yml`
2. Via un fichier `.env.docker`
3. En ligne de commande

### Créer un fichier .env.docker

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_DATABASE=invoices_db

# gRPC
GRPC_URL=0.0.0.0:50051

# Company Info
COMPANY_NAME=Votre Entreprise SAS
COMPANY_SIRET=12345678901234
# ... autres variables
```

Puis utiliser avec docker-compose :

```bash
docker-compose --env-file .env.docker up
```

## Tester le Service

### Depuis l'hôte

```bash
# Installer grpcurl
brew install grpcurl  # macOS
sudo apt install grpcurl  # Linux

# Tester le service
grpcurl -plaintext localhost:50051 list
```

### Depuis un autre container

```bash
# Créer un container temporaire avec grpcurl
docker run --rm --network service-factures_default \
  fullstorydev/grpcurl -plaintext invoice-service:50051 list
```

## Monitoring

### Health Check

Le container inclut un health check qui vérifie que le port gRPC est accessible.

Vérifier le statut :

```bash
docker-compose ps
```

### Métriques

Pour activer les métriques Prometheus :

```yaml
# docker-compose.yml
services:
  invoice-service:
    # ...
    ports:
      - "50051:50051"
      - "9090:9090"  # Métriques Prometheus
```

## Production

### Optimisations

1. **Multi-stage build** : Réduit la taille de l'image
2. **Non-root user** : Améliore la sécurité
3. **Health checks** : Détecte les containers défaillants
4. **Resource limits** : Ajoutez des limites de ressources

```yaml
services:
  invoice-service:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Secrets

Pour la production, utilisez Docker Secrets ou des variables d'environnement sécurisées :

```yaml
services:
  invoice-service:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    external: true
```

### Mise à jour sans downtime

```bash
# Build la nouvelle version
docker-compose build

# Scaling temporaire
docker-compose up -d --scale invoice-service=2

# Arrêter l'ancienne version
docker-compose up -d --scale invoice-service=1 --no-recreate
```

## Kubernetes (optionnel)

Pour déployer sur Kubernetes, générer les manifests :

```bash
# Installer kompose
brew install kompose

# Convertir docker-compose.yml en manifests K8s
kompose convert -f docker-compose.yml
```

## Troubleshooting

### Le service ne démarre pas

```bash
# Vérifier les logs
docker-compose logs invoice-service

# Vérifier que PostgreSQL est prêt
docker-compose logs postgres
```

### Erreur de connexion à la base de données

```bash
# Tester la connexion depuis le container
docker-compose exec invoice-service sh
# Puis dans le shell :
nc -zv postgres 5432
```

### Le port 50051 est déjà utilisé

```bash
# Trouver quel processus utilise le port
lsof -i :50051

# Ou changer le port dans docker-compose.yml
ports:
  - "50052:50051"
```

### Problèmes de permissions sur les volumes

```bash
# Vérifier les permissions
docker-compose exec invoice-service ls -la /app/storage

# Si nécessaire, recréer le container
docker-compose down
docker-compose up --force-recreate
```

## Nettoyage

### Supprimer tous les containers et volumes

```bash
# Arrêter et supprimer (garde les volumes)
docker-compose down

# Arrêter et supprimer (supprime aussi les volumes)
docker-compose down -v

# Nettoyer les images inutilisées
docker image prune -a
```

## CI/CD

### Exemple avec GitHub Actions

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t invoice-service:${{ github.sha }} .

      - name: Run tests
        run: docker run invoice-service:${{ github.sha }} npm test

      - name: Push to registry
        run: |
          docker tag invoice-service:${{ github.sha }} registry.example.com/invoice-service:latest
          docker push registry.example.com/invoice-service:latest
```

## Support

Pour plus d'informations :
- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Best Practices Docker](https://docs.docker.com/develop/dev-best-practices/)
