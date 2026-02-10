# API Source Specification for Contract Import

## Endpoint
- **URL**: Configurable via env var `EXTERNAL_API_URL` (e.g., `https://external-tool.com/api/contracts`)
- **Method**: `GET`
- **Auth**: API Key in header `X-API-Key: {value from EXTERNAL_API_KEY env var}`

## Request
No body, query params optional for pagination (v1 not implemented).

## Response Format
```json
[
  {
    "reference": "CONT-001",
    "statut": "actif",
    "date_debut": "2026-03-01",
    "client_id": "uuid-client",
    "commercial_id": "uuid-commercial",
    "montant": 1500.50,
    "devise": "EUR",
    "jour_prelevement": 15,
    "titre": "Contrat Fibre Pro",
    "description": "Abonnement fibre optique professionnel",
    "type": "abonnement",
    "date_fin": "2027-03-01",
    "date_signature": "2026-02-15",
    "frequence_facturation": "mensuel",
    "document_url": "https://docs.example.com/contrat-001.pdf",
    "fournisseur": "Fournisseur X",
    "societe_id": "uuid-societe",
    "notes": "Import automatique"
  }
]
```

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `reference` | string | Unique contract reference (used for upsert) |
| `statut` | string | Contract status (e.g., "actif", "en_attente", "resilie") |
| `date_debut` | string | Start date (ISO 8601: YYYY-MM-DD) |
| `client_id` | string (UUID) | Client identifier |
| `commercial_id` | string (UUID) | Commercial/sales agent identifier |

### Optional Fields
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `montant` | number | null | Contract amount |
| `devise` | string | "EUR" | Currency code |
| `jour_prelevement` | integer (1-28) | null | Day of month for automatic debit |
| `titre` | string | null | Contract title |
| `description` | string | null | Contract description |
| `type` | string | null | Contract type |
| `date_fin` | string | null | End date (ISO 8601) |
| `date_signature` | string | null | Signature date (ISO 8601) |
| `frequence_facturation` | string | null | Billing frequency |
| `document_url` | string | null | URL to contract document |
| `fournisseur` | string | null | Supplier name |
| `societe_id` | string (UUID) | null | Company identifier |
| `notes` | string | null | Additional notes |

## Error Handling
| HTTP Status | Action |
|-------------|--------|
| 401/403 | Invalid API key - log error, return import failed |
| 404 | Endpoint not found - log error, return import failed |
| 500+ | Server error - retry once, if still fails return import failed |
| Invalid JSON | Log error, return import failed |
| Missing required fields | Skip row, add to errors array |

## Upsert Logic
1. For each contract in the response array:
2. Check if contract with same `reference` exists for this `organisationId`
3. If exists: update all fields with new values
4. If not exists: create new contract

## Jour Prelevement Handling
- If `jour_prelevement` is present and valid (1-28): pass to contrat creation (which will trigger ContractDebitConfiguration in service-finance via event)
- If absent or null: create contract without debit config
- If invalid (< 1 or > 28): skip the field, log warning, continue import

## gRPC API

### ImportFromExternal
```protobuf
rpc ImportFromExternal(ImportFromExternalRequest) returns (ImportFromExternalResponse);
```

**Request:**
```json
{
  "organisation_id": "org-001",
  "source_url": "https://external-tool.com/api/contracts",
  "api_key": "your-api-key",
  "dry_run": true
}
```

**Response:**
```json
{
  "import_id": "uuid",
  "total_rows": 150,
  "created_count": 120,
  "updated_count": 25,
  "skipped_count": 5,
  "errors": [
    {
      "row": 42,
      "reference": "CONT-042",
      "error_message": "Missing required fields: client_id"
    }
  ]
}
```

### GetImportStatus
```protobuf
rpc GetImportStatus(GetImportStatusRequest) returns (GetImportStatusResponse);
```

**Request:**
```json
{
  "import_id": "uuid-from-import"
}
```

**Response:**
```json
{
  "import_id": "uuid",
  "status": "completed",
  "total_rows": 150,
  "processed_rows": 150,
  "created_count": 120,
  "updated_count": 25,
  "skipped_count": 5,
  "errors": []
}
```

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `EXTERNAL_API_URL` | Base URL of the external API | `https://external-tool.com/api/contracts` |
| `EXTERNAL_API_KEY` | API key for authentication | `sk-xxxx...` |
