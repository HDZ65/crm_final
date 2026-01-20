# Service Factures - Microservice gRPC de Facturation Conforme

Microservice NestJS gRPC de génération de factures conformes à la **réglementation française 2025** avec support **Factur-X** (PDF/A-3 + XML embarqué).

## Fonctionnalités

### ✅ Niveau 1 - Conformité Légale (IMPLÉMENTÉ)

1. **Mentions légales obligatoires**
   - Toutes les mentions obligatoires selon service-public.fr
   - Validation automatique avant génération PDF
   - Numérotation séquentielle obligatoire (CGI Article 242 nonies A)

2. **Blocage modification factures validées**
   - Une facture `VALIDATED` devient **IMMUTABLE**
   - Seule action autorisée : création d'un **Avoir** (credit note)
   - Guard NestJS bloquant toute tentative de modification

3. **Export Factur-X (PDF/A-3b + XML EN 16931)**
   - PDF lisible par l'humain
   - XML exploitable par la machine
   - Conforme standard européen de facturation électronique
   - Hash SHA256 pour vérification d'intégrité

## Stack Technique

- **Framework**: NestJS 11 (TypeScript)
- **Communication**: gRPC (@nestjs/microservices, @grpc/grpc-js)
- **ORM**: TypeORM avec PostgreSQL
- **Génération PDF**: PDFKit (PDF/A-3b)
- **Génération XML**: fast-xml-parser (Factur-X/EN 16931)
- **Validation**: class-validator

## Installation

### 1. Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- npm ou pnpm

### 2. Installation des dépendances

```bash
npm install
```

### 3. Configuration

Copier `.env.example` vers `.env` et configurer :

```bash
cp .env.example .env
```

Configurer les variables dans `.env` :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=invoices_db

# gRPC Configuration
GRPC_URL=0.0.0.0:50051

# Informations entreprise (OBLIGATOIRES pour conformité légale)
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

### 4. Créer la base de données

```bash
createdb invoices_db
```

### 5. Lancer le serveur

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

Le serveur gRPC démarre sur `0.0.0.0:50051`

## API gRPC

Le service expose une API gRPC définie dans `proto/invoice.proto`.

### Service Definition

```protobuf
service InvoiceService {
  // CRUD operations
  rpc CreateInvoice (CreateInvoiceRequest) returns (Invoice);
  rpc FindAllInvoices (FindAllRequest) returns (FindAllResponse);
  rpc FindOneInvoice (FindOneRequest) returns (Invoice);
  rpc UpdateInvoice (UpdateInvoiceRequest) returns (Invoice);
  rpc DeleteInvoice (DeleteRequest) returns (DeleteResponse);

  // Business operations
  rpc ValidateInvoice (ValidateInvoiceRequest) returns (Invoice);
  rpc MarkInvoiceAsPaid (MarkAsPaidRequest) returns (Invoice);
  rpc CreateCreditNote (CreateCreditNoteRequest) returns (Invoice);
  rpc DownloadInvoicePdf (DownloadPdfRequest) returns (DownloadPdfResponse);
}
```

### Exemple d'utilisation avec grpcurl

#### Créer une facture

```bash
grpcurl -plaintext -d '{
  "customerName": "Client SARL",
  "customerAddress": "45 Avenue des Champs, 75008 Paris",
  "customerSiret": "98765432100012",
  "customerTvaNumber": "FR98765432100",
  "customerEmail": "client@example.com",
  "issueDate": "2025-01-15",
  "deliveryDate": "2025-01-15",
  "paymentTermsDays": 30,
  "items": [{
    "description": "Prestation de développement web",
    "quantity": 10,
    "unit": "heure",
    "unitPriceHT": 80.00,
    "vatRate": 20.0,
    "discount": 0
  }]
}' localhost:50051 invoice.InvoiceService/CreateInvoice
```

#### Lister toutes les factures

```bash
grpcurl -plaintext -d '{}' localhost:50051 invoice.InvoiceService/FindAllInvoices
```

#### Récupérer une facture

```bash
grpcurl -plaintext -d '{"id": "uuid-here"}' localhost:50051 invoice.InvoiceService/FindOneInvoice
```

#### Valider une facture

```bash
grpcurl -plaintext -d '{"id": "uuid-here"}' localhost:50051 invoice.InvoiceService/ValidateInvoice
```

**Action :**
- Valide la conformité légale
- Génère le PDF/A-3b avec XML embarqué
- Change le status à `VALIDATED` (devient IMMUTABLE)
- Retourne la facture avec le chemin du PDF et son hash SHA256

#### Télécharger le PDF

```bash
grpcurl -plaintext -d '{"id": "uuid-here"}' localhost:50051 invoice.InvoiceService/DownloadInvoicePdf
```

Retourne les données binaires du PDF avec XML Factur-X embarqué (conforme EN 16931).

#### Créer un avoir (credit note)

```bash
grpcurl -plaintext -d '{"id": "uuid-here"}' localhost:50051 invoice.InvoiceService/CreateCreditNote
```

Seule opération autorisée sur une facture validée/payée.

### Utilisation depuis un client NestJS

```typescript
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVOICE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'invoice',
          protoPath: join(__dirname, './proto/invoice.proto'),
          url: 'localhost:50051',
        },
      },
    ]),
  ],
})
export class AppModule {}
```

## Conformité Légale Française

Toutes les factures incluent automatiquement toutes les mentions obligatoires selon le CGI 2025.

### Immutabilité des Factures

Une fois `VALIDATED`, une facture ne peut plus être modifiée. Seule action autorisée : créer un avoir.

### Format Factur-X

Le PDF généré est conforme au standard Factur-X (PDF/A-3b + XML EN 16931).

## Architecture Modulaire

Le projet est organisé en modules NestJS découplés pour une meilleure maintenabilité.

## Ressources

- [Service-Public.fr - Mentions obligatoires](https://entreprendre.service-public.fr/vosdroits/F31808)
- [Norme Factur-X](https://fnfe-mpe.org/factur-x/)
- [Norme EN 16931](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Compliance+with+eInvoicing+standard+EN16931)
