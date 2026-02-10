# Spécification API — Import de contrats vers le CRM

> **À transmettre à votre collègue.** Ce document décrit l'endpoint que son outil doit exposer pour que le CRM puisse importer les contrats automatiquement.

---

## Résumé

| Élément | Valeur |
|---------|--------|
| **Méthode HTTP** | `GET` |
| **Authentification** | Header `X-API-Key: {clé}` |
| **Format de réponse** | JSON — tableau d'objets contrat |
| **Content-Type** | `application/json` |

---

## Endpoint attendu

```
GET https://votre-outil.com/api/contracts
Header: X-API-Key: votre-clé-api
```

---

## Exemple de réponse

```json
[
  {
    "reference": "CONT-001",
    "statut": "actif",
    "date_debut": "2026-03-01",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "commercial_id": "660e8400-e29b-41d4-a716-446655440001",
    "montant": 1500.50,
    "devise": "EUR",
    "jour_prelevement": 15,
    "titre": "Contrat Fibre Pro",
    "type": "abonnement",
    "date_fin": "2027-03-01",
    "date_signature": "2026-02-15",
    "frequence_facturation": "mensuel",
    "fournisseur": "Fournisseur X",
    "societe_id": "770e8400-e29b-41d4-a716-446655440002",
    "notes": "Import automatique"
  },
  {
    "reference": "CONT-002",
    "statut": "en_attente",
    "date_debut": "2026-04-01",
    "client_id": "880e8400-e29b-41d4-a716-446655440003",
    "commercial_id": "660e8400-e29b-41d4-a716-446655440001",
    "montant": 29.99
  }
]
```

---

## Champs obligatoires

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `reference` | `string` | Référence unique du contrat. **Clé de dédoublonnage** : si la référence existe déjà, le contrat est mis à jour. | `"CONT-001"` |
| `statut` | `string` | Statut du contrat | `"actif"`, `"en_attente"`, `"resilie"` |
| `date_debut` | `string` (date) | Date de début — format **YYYY-MM-DD** | `"2026-03-01"` |
| `client_id` | `string` (UUID) | Identifiant du client dans le CRM | `"550e8400-..."` |
| `commercial_id` | `string` (UUID) | Identifiant du commercial dans le CRM | `"660e8400-..."` |

> **⚠️ Si un champ obligatoire est manquant**, la ligne est ignorée et reportée en erreur (les autres contrats sont quand même importés).

---

## Champs optionnels

| Champ | Type | Par défaut | Description |
|-------|------|------------|-------------|
| `jour_prelevement` | `integer` (1-28) | — | Jour fixe de prélèvement mensuel. Si absent, le contrat est créé sans config de prélèvement. |
| `montant` | `number` | `null` | Montant du contrat |
| `devise` | `string` | `"EUR"` | Code devise (ISO 4217) |
| `titre` | `string` | `null` | Titre du contrat |
| `description` | `string` | `null` | Description |
| `type` | `string` | `null` | Type de contrat (ex: `"abonnement"`, `"prestation"`) |
| `date_fin` | `string` (date) | `null` | Date de fin — YYYY-MM-DD |
| `date_signature` | `string` (date) | `null` | Date de signature — YYYY-MM-DD |
| `frequence_facturation` | `string` | `null` | Fréquence de facturation (ex: `"mensuel"`, `"trimestriel"`) |
| `fournisseur` | `string` | `null` | Nom du fournisseur |
| `societe_id` | `string` (UUID) | `null` | Identifiant de la société |
| `document_url` | `string` (URL) | `null` | URL vers le document du contrat |
| `notes` | `string` | `null` | Notes libres |

---

## JSON Schema

Votre collègue peut utiliser ce JSON Schema pour valider sa réponse :

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Contract Import API Response",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["reference", "statut", "date_debut", "client_id", "commercial_id"],
    "properties": {
      "reference": { "type": "string" },
      "statut": { "type": "string" },
      "date_debut": { "type": "string", "format": "date" },
      "client_id": { "type": "string", "format": "uuid" },
      "commercial_id": { "type": "string", "format": "uuid" },
      "jour_prelevement": { "type": "integer", "minimum": 1, "maximum": 28 },
      "montant": { "type": "number", "minimum": 0 },
      "devise": { "type": "string", "default": "EUR" },
      "titre": { "type": "string" },
      "description": { "type": "string" },
      "type": { "type": "string" },
      "date_fin": { "type": "string", "format": "date" },
      "date_signature": { "type": "string", "format": "date" },
      "frequence_facturation": { "type": "string" },
      "fournisseur": { "type": "string" },
      "societe_id": { "type": "string", "format": "uuid" },
      "document_url": { "type": "string", "format": "uri" },
      "notes": { "type": "string" }
    },
    "additionalProperties": false
  }
}
```

---

## Comportement du CRM

| Situation | Action du CRM |
|-----------|---------------|
| Contrat avec `reference` existante | **Mise à jour** de tous les champs |
| Contrat avec `reference` nouvelle | **Création** d'un nouveau contrat |
| Champ obligatoire manquant | **Ligne ignorée**, ajoutée au rapport d'erreurs |
| `jour_prelevement` présent (1-28) | Configuration de prélèvement automatique créée |
| `jour_prelevement` absent | Contrat créé sans prélèvement |
| `jour_prelevement` invalide (0, 29+) | Champ ignoré, warning dans les logs |
| Erreur HTTP (401, 404, 500) | Import échoué, erreur loguée |

---

## Fréquence d'appel

- **Manuel** : l'utilisateur CRM peut déclencher l'import à la demande
- **Automatique** : appel quotidien à **2h du matin** (configurable)

> L'endpoint sera appelé au maximum **1 fois par jour** en mode automatique.

---

## Questions pour votre collègue

1. Quelle sera l'**URL exacte** de l'endpoint ?
2. Comment sera gérée l'**authentification** (clé API fixe ? Token rotatif ?) ?
3. Y a-t-il une **limite** sur le nombre de contrats retournés ? (pagination à prévoir pour v2)
4. Les **UUIDs client/commercial** — comment les mapper avec les identifiants de son outil ?
