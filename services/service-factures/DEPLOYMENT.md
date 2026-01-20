# Guide de Déploiement - Microservice gRPC Factures

Ce document décrit les différentes options de déploiement du microservice de facturation.

## Table des Matières

1. [Déploiement Local](#déploiement-local)
2. [Déploiement Docker](#déploiement-docker)
3. [Déploiement Kubernetes](#déploiement-kubernetes)
4. [Déploiement Cloud](#déploiement-cloud)
5. [Configuration Production](#configuration-production)

---

## Déploiement Local

### Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- npm ou pnpm

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 3. Créer la base de données
createdb invoices_db

# 4. Démarrer le service
npm run start:dev
```

Le service sera accessible sur `localhost:50051`

---

## Déploiement Docker

### Option 1 : Docker Compose (Recommandé)

#### Développement

```bash
# Démarrer avec hot-reload
docker-compose -f docker-compose.dev.yml up

# Reconstruire après modification
docker-compose -f docker-compose.dev.yml up --build
```

#### Production

```bash
# Démarrer en production
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Option 2 : Docker Standalone

```bash
# 1. Build l'image
docker build -t invoice-service:latest .

# 2. Créer un réseau
docker network create invoice-network

# 3. Démarrer PostgreSQL
docker run -d \
  --name postgres \
  --network invoice-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=invoices_db \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# 4. Démarrer le service
docker run -d \
  --name invoice-service \
  --network invoice-network \
  -p 50051:50051 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=invoices_db \
  -e COMPANY_NAME="Votre Entreprise" \
  -e COMPANY_SIRET="12345678901234" \
  -v invoice_pdfs:/app/storage/pdfs \
  invoice-service:latest
```

### Tester le Service

```bash
# Installer grpcurl
brew install grpcurl  # macOS
sudo apt install grpcurl  # Linux

# Lister les services
grpcurl -plaintext localhost:50051 list

# Créer une facture de test
grpcurl -plaintext -d '{
  "customerName": "Test Client",
  "customerAddress": "123 Rue Test, 75001 Paris",
  "issueDate": "2025-01-15",
  "deliveryDate": "2025-01-15",
  "items": [{
    "description": "Service test",
    "quantity": 1,
    "unitPriceHT": 100.00,
    "vatRate": 20.0
  }]
}' localhost:50051 invoice.InvoiceService/CreateInvoice
```

---

## Déploiement Kubernetes

### Prérequis

- Cluster Kubernetes
- kubectl configuré
- Helm (optionnel)

### Manifests Kubernetes

#### 1. Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: invoices
```

#### 2. ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: invoice-config
  namespace: invoices
data:
  DB_HOST: "postgres"
  DB_PORT: "5432"
  DB_DATABASE: "invoices_db"
  GRPC_URL: "0.0.0.0:50051"
  INVOICE_PREFIX: "INV"
  NODE_ENV: "production"
```

#### 3. Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: invoice-secret
  namespace: invoices
type: Opaque
stringData:
  DB_USERNAME: postgres
  DB_PASSWORD: your_secure_password
  COMPANY_SIRET: "12345678901234"
```

#### 4. PostgreSQL Deployment

```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: invoices
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: invoices_db
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: invoice-secret
              key: DB_USERNAME
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: invoice-secret
              key: DB_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: invoices
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

#### 5. Invoice Service Deployment

```yaml
# k8s/invoice-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: invoice-service
  namespace: invoices
spec:
  replicas: 3
  selector:
    matchLabels:
      app: invoice-service
  template:
    metadata:
      labels:
        app: invoice-service
    spec:
      containers:
      - name: invoice-service
        image: your-registry/invoice-service:latest
        ports:
        - containerPort: 50051
          name: grpc
        envFrom:
        - configMapRef:
            name: invoice-config
        env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: invoice-secret
              key: DB_USERNAME
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: invoice-secret
              key: DB_PASSWORD
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          tcpSocket:
            port: 50051
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          tcpSocket:
            port: 50051
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: pdf-storage
          mountPath: /app/storage/pdfs
      volumes:
      - name: pdf-storage
        persistentVolumeClaim:
          claimName: invoice-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: invoice-service
  namespace: invoices
spec:
  selector:
    app: invoice-service
  ports:
  - port: 50051
    targetPort: 50051
    name: grpc
  type: ClusterIP
```

#### 6. PersistentVolumeClaims

```yaml
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: invoices
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: invoice-pvc
  namespace: invoices
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
```

### Déploiement

```bash
# Créer les ressources
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/invoice-service.yaml

# Vérifier le déploiement
kubectl get pods -n invoices
kubectl logs -n invoices deployment/invoice-service

# Exposer le service (optionnel)
kubectl port-forward -n invoices svc/invoice-service 50051:50051
```

---

## Déploiement Cloud

### AWS ECS

#### 1. Créer un Task Definition

```json
{
  "family": "invoice-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "invoice-service",
      "image": "your-ecr-repo/invoice-service:latest",
      "portMappings": [
        {
          "containerPort": 50051,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/invoice-service",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# Build et push l'image
gcloud builds submit --tag gcr.io/PROJECT-ID/invoice-service

# Déployer
gcloud run deploy invoice-service \
  --image gcr.io/PROJECT-ID/invoice-service \
  --platform managed \
  --region europe-west1 \
  --port 50051 \
  --set-env-vars NODE_ENV=production \
  --set-cloudsql-instances PROJECT-ID:europe-west1:invoices-db
```

### Azure Container Instances

```bash
# Créer un groupe de ressources
az group create --name invoice-rg --location westeurope

# Déployer le container
az container create \
  --resource-group invoice-rg \
  --name invoice-service \
  --image your-acr.azurecr.io/invoice-service:latest \
  --ports 50051 \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    NODE_ENV=production \
    DB_HOST=postgres.database.windows.net \
  --secure-environment-variables \
    DB_PASSWORD=$DB_PASSWORD
```

---

## Configuration Production

### Variables d'Environnement Essentielles

```env
# Application
NODE_ENV=production
GRPC_URL=0.0.0.0:50051

# Database (utiliser des secrets sécurisés)
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USERNAME=invoice_user
DB_PASSWORD=<strong-password>
DB_DATABASE=invoices_db

# Informations légales (OBLIGATOIRES)
COMPANY_NAME="Votre Entreprise SAS"
COMPANY_SIRET="12345678901234"
COMPANY_SIREN="123456789"
COMPANY_TVA="FR12345678901"
COMPANY_RCS="Paris B 123 456 789"
COMPANY_CAPITAL="10000"
COMPANY_EMAIL="comptabilite@example.com"
COMPANY_PHONE="+33 1 23 45 67 89"
COMPANY_ADDRESS="123 Rue Example, 75001 Paris, France"

# Storage
PDF_STORAGE_PATH=/data/pdfs
PDF_TEMP_PATH=/tmp/invoices
```

### Checklist Production

- [ ] Utiliser des secrets pour les mots de passe (pas de .env en dur)
- [ ] Configurer le SSL/TLS pour gRPC
- [ ] Activer le monitoring (Prometheus, DataDog, etc.)
- [ ] Configurer les logs centralisés (ELK, CloudWatch, etc.)
- [ ] Mettre en place des backups automatiques de la base
- [ ] Configurer des health checks
- [ ] Limiter les ressources CPU/Memory
- [ ] Activer l'auto-scaling
- [ ] Configurer les alertes (erreurs, latence, etc.)
- [ ] Documenter les procédures de rollback

### Sécurité

#### TLS pour gRPC

```typescript
// main.ts
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.GRPC,
    options: {
      package: 'invoice',
      protoPath: join(__dirname, '../proto/invoice.proto'),
      url: '0.0.0.0:50051',
      credentials: ServerCredentials.createSsl(
        Buffer.from(process.env.TLS_ROOT_CERT),
        [
          {
            cert_chain: Buffer.from(process.env.TLS_CERT),
            private_key: Buffer.from(process.env.TLS_KEY),
          },
        ],
        true,
      ),
    },
  },
);
```

#### Authentication Metadata

```typescript
// Ajouter un interceptor pour valider les tokens
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const metadata: Metadata = context.switchToRpc().getContext();
    const token = metadata.get('authorization')[0];

    if (!this.validateToken(token)) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid token',
      });
    }

    return next.handle();
  }
}
```

### Monitoring et Observabilité

#### Prometheus Metrics

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

#### OpenTelemetry

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

### Backups

#### PostgreSQL

```bash
# Backup automatique quotidien
0 2 * * * pg_dump -h localhost -U postgres invoices_db > /backups/invoices_$(date +\%Y\%m\%d).sql

# Rétention 30 jours
find /backups -name "invoices_*.sql" -mtime +30 -delete
```

#### Volumes Docker

```bash
# Backup volume des PDFs
docker run --rm -v invoice_pdfs:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/pdfs_$(date +%Y%m%d).tar.gz -C /data .
```

---

## Support et Maintenance

### Logs

```bash
# Docker
docker-compose logs -f invoice-service

# Kubernetes
kubectl logs -f deployment/invoice-service -n invoices

# Local
npm run start:prod 2>&1 | tee logs/app.log
```

### Mise à jour

```bash
# 1. Build la nouvelle version
docker build -t invoice-service:v1.1.0 .

# 2. Tag comme latest
docker tag invoice-service:v1.1.0 invoice-service:latest

# 3. Déployer (zero-downtime avec docker-compose)
docker-compose up -d --no-deps --build invoice-service
```

### Rollback

```bash
# Docker Compose
docker-compose down
docker tag invoice-service:v1.0.0 invoice-service:latest
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/invoice-service -n invoices
```

---

## Ressources Complémentaires

- [Documentation Docker](./DOCKER.md)
- [Guide de démarrage rapide](./QUICK_START.md)
- [Exemple de client gRPC](./GRPC_CLIENT_EXAMPLE.md)
- [Documentation NestJS](https://docs.nestjs.com/microservices/grpc)
