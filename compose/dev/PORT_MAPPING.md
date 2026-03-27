# Mapping des Ports - CRM Gestion (Dev)

## Plage réservée : 3400-3499

### Infrastructure
| Service | Port Host | Port Container | Description |
|---------|-----------|----------------|-------------|
| PostgreSQL | 3401 | 5432 | Base de données principale |
| Keycloak | 3402 | 8080 | Authentification ✓ |
| Redis | 3403 | 6379 | Cache et sessions |
| NATS | 3404 | 4222 | Event streaming |
| NATS Monitor | 3405 | 8222 | Interface de monitoring NATS |
| Consul | 3406 | 8500 | Service discovery |

### Services Applicatifs
| Service | Port Host | Port Container | Description |
|---------|-----------|----------------|-------------|
| Frontend | 3400 | 3000 | Interface Next.js ✓ |
| Service Core | 3407 | 3052 | Service principal |
| Service Commercial | 3408 | 3053 | Gestion commerciale |
| Service Finance | 3409 | 3059 | Gestion financière |
| Service Engagement | 3410 | 3051 | Gestion engagement client |
| Service Gateway | 3411 | 3050 | API Gateway |
| Service Logistics | 3412 | 3060 | Gestion logistique |
| Service Telecom | 3413 | 3077 | Gestion télécom |

### Services Additionnels (si nécessaire)
| Service | Port Host | Port Container | Description |
|---------|-----------|----------------|-------------|
| Service Catalog | 3414 | 3054 | Catalogue produits |
| Service Integrations | 3415 | 3055 | Intégrations externes |
| Service Qualité | 3416 | 3056 | Contrôle qualité |

## Notes
- Tous les ports sont bindés sur `127.0.0.1` pour la sécurité
- Les ports gRPC (50xxx) ne sont pas exposés sur l'hôte (communication via réseau Docker uniquement)
- Cette configuration respecte le slot 4 défini dans `/ports.yaml`

## Accès aux services
- Frontend : http://localhost:3400
- Keycloak Admin : http://localhost:3402
- Consul UI : http://localhost:3406
- NATS Monitor : http://localhost:3405

## Connexions base de données
- PostgreSQL : `postgresql://postgres:postgres@localhost:3401/crm_dev`
- Redis : `redis://localhost:3403`