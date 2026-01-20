# Guide de Démarrage Rapide - Microservice gRPC Factures

## Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- grpcurl (optionnel, pour tester les endpoints)

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos informations :

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=invoices_db

# gRPC Configuration
GRPC_URL=0.0.0.0:50051

# Informations entreprise (OBLIGATOIRES)
COMPANY_NAME=Votre Entreprise SAS
COMPANY_ADDRESS=123 Rue Example, 75001 Paris, France
COMPANY_SIRET=12345678901234
COMPANY_SIREN=123456789
COMPANY_TVA=FR12345678901
COMPANY_RCS=Paris B 123 456 789
COMPANY_CAPITAL=10000
COMPANY_EMAIL=contact@example.com
COMPANY_PHONE=+33 1 23 45 67 89
```

### 3. Créer la base de données

```bash
createdb invoices_db
```

Ou via psql :

```sql
CREATE DATABASE invoices_db;
```

### 4. Démarrer le microservice

```bash
# Mode développement (avec hot-reload)
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

Le serveur gRPC démarre sur `0.0.0.0:50051`

## Tester le Microservice

### Option 1 : Avec grpcurl

#### Installer grpcurl

```bash
# Linux
sudo apt install grpcurl

# macOS
brew install grpcurl

# Windows (avec Chocolatey)
choco install grpcurl
```

#### Lister les services disponibles

```bash
grpcurl -plaintext localhost:50051 list
```

#### Lister les méthodes d'un service

```bash
grpcurl -plaintext localhost:50051 list invoice.InvoiceService
```

#### Créer une facture

```bash
grpcurl -plaintext -d '{
  "customerName": "ACME Corporation",
  "customerAddress": "123 Rue du Commerce, 75001 Paris, France",
  "customerSiret": "98765432100012",
  "customerTvaNumber": "FR98765432100",
  "customerEmail": "contact@acme.com",
  "issueDate": "2025-01-15",
  "deliveryDate": "2025-01-15",
  "paymentTermsDays": 30,
  "items": [
    {
      "description": "Prestation de développement web",
      "quantity": 10,
      "unit": "heure",
      "unitPriceHT": 80.00,
      "vatRate": 20.0,
      "discount": 0
    },
    {
      "description": "Hébergement annuel",
      "quantity": 1,
      "unit": "an",
      "unitPriceHT": 500.00,
      "vatRate": 20.0,
      "discount": 50
    }
  ]
}' localhost:50051 invoice.InvoiceService/CreateInvoice
```

#### Lister toutes les factures

```bash
grpcurl -plaintext -d '{}' localhost:50051 invoice.InvoiceService/FindAllInvoices
```

#### Récupérer une facture spécifique

```bash
grpcurl -plaintext -d '{"id": "VOTRE_UUID_ICI"}' localhost:50051 invoice.InvoiceService/FindOneInvoice
```

#### Valider une facture (génère le PDF Factur-X)

```bash
grpcurl -plaintext -d '{"id": "VOTRE_UUID_ICI"}' localhost:50051 invoice.InvoiceService/ValidateInvoice
```

#### Marquer comme payée

```bash
grpcurl -plaintext -d '{"id": "VOTRE_UUID_ICI"}' localhost:50051 invoice.InvoiceService/MarkInvoiceAsPaid
```

#### Créer un avoir (credit note)

```bash
grpcurl -plaintext -d '{"id": "VOTRE_UUID_ICI"}' localhost:50051 invoice.InvoiceService/CreateCreditNote
```

### Option 2 : Client NestJS

Voir le fichier `GRPC_CLIENT_EXAMPLE.md` pour un exemple complet d'intégration dans une application NestJS.

## Structure du Projet

```
service-factures/
├── proto/                          # Fichiers Protocol Buffers
│   └── invoice.proto              # Définition du service gRPC
├── src/
│   ├── modules/
│   │   ├── invoices/              # Module principal des factures
│   │   │   ├── invoices.controller.ts   # Contrôleur gRPC
│   │   │   ├── invoices.service.ts      # Logique métier
│   │   │   ├── entities/          # Entités TypeORM
│   │   │   ├── dto/               # DTOs de validation
│   │   │   └── guards/            # Guards d'immutabilité
│   │   ├── compliance/            # Module de conformité légale
│   │   └── pdf-generation/        # Module de génération PDF Factur-X
│   ├── common/                    # Code partagé
│   ├── app.module.ts              # Module racine
│   └── main.ts                    # Point d'entrée gRPC
├── storage/
│   └── pdfs/                      # PDFs générés
├── .env                           # Configuration
└── package.json
```

## Fonctionnalités

### ✅ Conformité Légale Française 2025

- Toutes les mentions obligatoires automatiques
- Numérotation séquentielle (CGI Article 242 nonies A)
- Conditions de paiement conformes (30 jours max)
- Pénalités de retard et indemnité forfaitaire

### ✅ Immutabilité des Factures

Une facture `VALIDATED` devient **IMMUTABLE** :

- ❌ Modification impossible
- ❌ Suppression impossible
- ✅ Seule action autorisée : créer un avoir (credit note)

### ✅ Format Factur-X

- PDF/A-3b lisible par l'humain
- XML EN 16931 embarqué (exploitable par la machine)
- Hash SHA256 pour vérification d'intégrité
- Conforme à la norme européenne de facturation électronique

## Flux de Travail Typique

1. **Créer une facture** (status: `DRAFT`)
2. **Modifier si nécessaire** (uniquement en status `DRAFT`)
3. **Valider la facture** → Génère le PDF Factur-X, status devient `VALIDATED`
4. **Marquer comme payée** → status devient `PAID`
5. **Si erreur** → Créer un avoir (credit note)

## Troubleshooting

### Le serveur ne démarre pas

- Vérifier que PostgreSQL est en cours d'exécution
- Vérifier les credentials dans `.env`
- Vérifier que le port 50051 n'est pas déjà utilisé

### Erreur de connexion à la base de données

```bash
# Vérifier la connexion PostgreSQL
psql -h localhost -U postgres -d invoices_db
```

### Le PDF n'est pas généré

- Vérifier que le dossier `storage/pdfs` existe et est accessible en écriture
- Vérifier les logs pour les erreurs de génération

### Erreurs de validation

Les DTOs utilisent `class-validator`. Vérifiez que toutes les données requises sont fournies :

- `customerName` (obligatoire)
- `customerAddress` (obligatoire)
- `issueDate` (obligatoire)
- `deliveryDate` (obligatoire)
- `items` (au moins un item obligatoire)

## Ressources

- [Documentation NestJS Microservices](https://docs.nestjs.com/microservices/grpc)
- [Protocol Buffers Guide](https://protobuf.dev/)
- [Standard Factur-X](https://fnfe-mpe.org/factur-x/)
- [Norme EN 16931](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Compliance+with+eInvoicing+standard+EN16931)
- [Service-Public.fr - Mentions obligatoires](https://entreprendre.service-public.fr/vosdroits/F31808)
