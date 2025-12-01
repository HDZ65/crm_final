// src/mcp/mcp.tools.ts

/** JSON Schema minimal supporté par notre passerelle MCP */
export type JsonSchema =
  | {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
      additionalProperties?: boolean;
    }
  | { type: 'string' | 'number' | 'integer' | 'boolean' };

/** Définition d’un tool MCP */
export type ToolDef = Readonly<{
  name: string;
  description: string;
  input_schema: JsonSchema;
}>;

/**
 * Registre MCP — PHASE 1
 * On mappe les tools aux DTOs fournis et on ajoute `organisationId` (tenant) + champs d’audit si besoin.
 * Les dates sont des string ISO 8601.
 */
export const toolDefs: readonly ToolDef[] = [
  // =========================
  // CLIENTS (ClientBase)
  // =========================
  {
    name: 'search_clients',
    description: 'Liste les clients (ClientBase). Mappe: GET /clientbases',
    input_schema: {
      type: 'object',
      properties: {
        organisationId: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        offset: { type: 'integer', minimum: 0, default: 0 },
      },
      required: ['organisationId'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_client',
    description: 'Récupère un ClientBase par ID. Mappe: GET /clientbases/{id}',
    input_schema: {
      type: 'object',
      properties: {
        organisationId: { type: 'string' },
        clientId: { type: 'string' },
      },
      required: ['organisationId', 'clientId'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_client',
    description:
      'Crée un ClientBase. Mappe: POST /clientbases (CreateClientBaseDto).',
    input_schema: {
      type: 'object',
      properties: {
        // Tenant + audit
        organisationId: { type: 'string' },

        // DTO CreateClientBaseDto
        typeClient: { type: 'string' },
        nom: { type: 'string' },
        prenom: { type: 'string' },
        dateNaissance: { type: 'string' }, // ISO ou null côté service
        compteCode: { type: 'string' },
        partenaireId: { type: 'string' },
        dateCreation: { type: 'string' }, // ISO
        telephone: { type: 'string' },
        statutId: { type: 'string' },
      },
      required: [
        'organisationId',
        'typeClient',
        'nom',
        'prenom',
        'compteCode',
        'partenaireId',
        'dateCreation',
        'telephone',
        'statutId',
      ],
      additionalProperties: false,
    },
  },

  // =========================
  // CONTRATS
  // =========================
  {
    name: 'create_contract',
    description:
      'Crée un contrat. Mappe: POST /contrats (CreateContratDto).',
    input_schema: {
      type: 'object',
      properties: {
        // Tenant
        organisationId: { type: 'string' },

        // DTO CreateContratDto
        referenceExterne: { type: 'string' },
        dateSignature: { type: 'string' },      // ISO
        dateDebut: { type: 'string' },          // ISO
        dateFin: { type: 'string' },            // ISO
        statutId: { type: 'string' },
        autoRenouvellement: { type: 'boolean' },
        joursPreavis: { type: 'integer' },
        conditionPaiementId: { type: 'string' },
        modeleDistributionId: { type: 'string' },
        facturationParId: { type: 'string' },
        clientBaseId: { type: 'string' },
        commercialId: { type: 'string' },
        clientPartenaireId: { type: 'string' },
        adresseFacturationId: { type: 'string' },
        dateFinRetractation: { type: 'string' }, // ISO
      },
      required: [
        'organisationId',
        'referenceExterne',
        'dateSignature',
        'dateDebut',
        'dateFin',
        'statutId',
        'autoRenouvellement',
        'joursPreavis',
        'conditionPaiementId',
        'modeleDistributionId',
        'facturationParId',
        'clientBaseId',
        'commercialId',
        'clientPartenaireId',
        'adresseFacturationId',
        'dateFinRetractation',
      ],
      additionalProperties: false,
    },
  },
  {
  name: 'get_contract',
  description: 'GET /contrats/{id}',
  input_schema: {
    type: 'object',
    properties: { organisationId: { type: 'string' }, contractId: { type: 'string' } },
    required: ['organisationId', 'contractId'],
    additionalProperties: false,
  },
},
{
  name: 'search_contracts',
  description: 'GET /contrats (filtres client/statut/dates/limit/offset)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      clientId: { type: 'string' },
      statutId: { type: 'string' },
      dateDebut: { type: 'string' }, // ISO
      dateFin: { type: 'string' },   // ISO
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    required: ['organisationId'],
    additionalProperties: false,
  },
},
{
  name: 'update_contract',
  description: 'PUT /contrats/{id} (champs partiels)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      contractId: { type: 'string' },
      patch: { type: 'object', additionalProperties: true }, // ex: { statutId, dateFin, ... }
    },
    required: ['organisationId', 'contractId', 'patch'],
    additionalProperties: false,
  },
},
{
  name: 'delete_contract',
  description: 'DELETE /contrats/{id}',
  input_schema: {
    type: 'object',
    properties: { organisationId: { type: 'string' }, contractId: { type: 'string' } },
    required: ['organisationId', 'contractId'],
    additionalProperties: false,
  },
},
{
  name: 'orchestrate_contract',
  description: 'POST /orchestration/contracts/{contractId}/(activate|suspend|terminate|port-in)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      contractId: { type: 'string' },
      action: { type: 'string', enum: ['activate','suspend','terminate','port-in'] },
      reason: { type: 'string' },
      effectiveDate: { type: 'string' }, // ISO
      idempotencyKey: { type: 'string' },
    },
    required: ['organisationId', 'contractId', 'action'],
    additionalProperties: false,
  },
},

  // =========================
  // FACTURES
  // =========================
  {
    name: 'create_invoice',
    description:
      'Crée une facture. Mappe: POST /factures (CreateFactureDto).',
    input_schema: {
      type: 'object',
      properties: {
        // Tenant
        organisationId: { type: 'string' },

        // DTO CreateFactureDto
        numero: { type: 'string' },
        dateEmission: { type: 'string' }, // ISO
        montantHT: { type: 'number' },
        montantTTC: { type: 'number' },
        statutId: { type: 'string' },
        emissionFactureId: { type: 'string' },
        clientBaseId: { type: 'string' },
        contratId: { type: 'string' }, // nullable côté service
        clientPartenaireId: { type: 'string' },
        adresseFacturationId: { type: 'string' },
      },
      required: [
        'organisationId',
        'numero',
        'dateEmission',
        'montantHT',
        'montantTTC',
        'statutId',
        'emissionFactureId',
        'clientBaseId',
        'clientPartenaireId',
        'adresseFacturationId',
      ],
      additionalProperties: false,
    },
  },
  {
  name: 'get_invoice',
  description: 'GET /factures/{id}',
  input_schema: {
    type: 'object',
    properties: { organisationId: { type: 'string' }, invoiceId: { type: 'string' } },
    required: ['organisationId', 'invoiceId'],
    additionalProperties: false,
  },
},
{
  name: 'search_invoices',
  description: 'GET /factures (client/statut/dates/limit/offset)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      clientId: { type: 'string' },
      statutId: { type: 'string' },
      dateFrom: { type: 'string' },
      dateTo: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    required: ['organisationId'],
    additionalProperties: false,
  },
},
{
  name: 'update_invoice',
  description: 'PUT /factures/{id}',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      invoiceId: { type: 'string' },
      patch: { type: 'object', additionalProperties: true }, // ex: { statutId, montantHT, ... }
    },
    required: ['organisationId','invoiceId','patch'],
    additionalProperties: false,
  },
},

  // =========================
  // ACTIVITÉS
  // =========================
  {
    name: 'create_activity',
    description:
      'Crée une activité liée à un client/contrat. Mappe: POST /activites (CreateActiviteDto).',
    input_schema: {
      type: 'object',
      properties: {
        // Tenant
        organisationId: { type: 'string' },

        // DTO CreateActiviteDto
        typeId: { type: 'string' },
        dateActivite: { type: 'string' }, // ISO
        sujet: { type: 'string' },
        commentaire: { type: 'string' },
        echeance: { type: 'string' }, // ISO
        clientBaseId: { type: 'string' },
        contratId: { type: 'string' },
        clientPartenaireId: { type: 'string' },
      },
      required: [
        'organisationId',
        'typeId',
        'dateActivite',
        'sujet',
        'commentaire',
        'echeance',
        'clientBaseId',
        'contratId',
        'clientPartenaireId',
      ],
      additionalProperties: false,
    },
  },
  {
  name: 'get_activity',
  description: 'GET /activites/{id}',
  input_schema: {
    type: 'object',
    properties: { organisationId: { type: 'string' }, activityId: { type: 'string' } },
    required: ['organisationId', 'activityId'],
    additionalProperties: false,
  },
},
{
  name: 'search_activities',
  description: 'GET /activites (client/contrat/date/limit/offset)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      clientBaseId: { type: 'string' },
      contratId: { type: 'string' },
      dateFrom: { type: 'string' },
      dateTo: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    required: ['organisationId'],
    additionalProperties: false,
  },
},
{
  name: 'update_activity',
  description: 'PUT /activites/{id}',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      activityId: { type: 'string' },
      patch: { type: 'object', additionalProperties: true },
    },
    required: ['organisationId','activityId','patch'],
    additionalProperties: false,
  },
},

  // =========================
  // LOGISTIQUE
  // =========================
  {
    name: 'logistics_create_label',
    description:
      'Crée une étiquette d’expédition. Mappe: POST /logistics/labels (CreateLabelDto).',
    input_schema: {
      type: 'object',
      properties: {
        // Tenant
        organisationId: { type: 'string' },

        // DTO CreateLabelDto
        contractId: { type: 'string' }, // nullable côté service
        serviceLevel: { type: 'string' },
        format: { type: 'string' },
        weightGr: { type: 'number' },
        sender: {
          type: 'object',
          properties: {
            line1: { type: 'string' },
            line2: { type: 'string' },
            postalCode: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
          },
          required: ['line1', 'postalCode', 'city', 'country'],
          additionalProperties: false,
        },
        recipient: {
          type: 'object',
          properties: {
            line1: { type: 'string' },
            line2: { type: 'string' },
            postalCode: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
          },
          required: ['line1', 'postalCode', 'city', 'country'],
          additionalProperties: false,
        },
        payload: { type: 'object', additionalProperties: true },
      },
      required: ['organisationId', 'serviceLevel', 'format', 'weightGr', 'sender', 'recipient'],
      additionalProperties: false,
    },
  },
  {
    name: 'logistics_track',
    description:
      'Récupère le suivi d’un colis. Mappe: GET /logistics/track/{trackingNumber}',
    input_schema: {
      type: 'object',
      properties: {
        organisationId: { type: 'string' },
        trackingNumber: { type: 'string' },
      },
      required: ['organisationId', 'trackingNumber'],
      additionalProperties: false,
    },
  },
  {
  name: 'logistics_validate_address',
  description: 'POST /logistics/addresses/validate',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      address: {
        type: 'object',
        properties: {
          line1: { type: 'string' },
          line2: { type: 'string' },
          postalCode: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
        },
        required: ['line1','postalCode','city','country'],
        additionalProperties: false,
      },
    },
    required: ['organisationId', 'address'],
    additionalProperties: false,
  },
},
{
  name: 'logistics_pricing_simulate',
  description: 'POST /logistics/pricing/simulate',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      weightGr: { type: 'number' },
      fromPostalCode: { type: 'string' },
      toPostalCode: { type: 'string' },
      carrier: { type: 'string' },
      serviceLevel: { type: 'string' },
    },
    required: ['organisationId','weightGr','fromPostalCode','toPostalCode'],
    additionalProperties: false,
  },
},

  // =========================
  // Gourpes, Permissions, Produits
  // =========================
{
  name: 'list_groups',
  description: 'GET /groupes (liste paginée/tenant)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    required: ['organisationId'],
    additionalProperties: false,
  },
},
{
  name: 'add_client_to_group',
  description: 'POST /affectationgroupeclients (lier ClientBase ↔ Groupe)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      clientBaseId: { type: 'string' },
      groupeId: { type: 'string' },
    },
    required: ['organisationId','clientBaseId','groupeId'],
    additionalProperties: false,
  },
},
{
  name: 'list_permissions',
  description: 'GET /permissions (utile pour RBAC côté assistant)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    required: ['organisationId'],
    additionalProperties: false,
  },
},
{
  name: 'search_products',
  description: 'GET /produits (q/limit/offset)',
  input_schema: {
    type: 'object',
    properties: {
      organisationId: { type: 'string' },
      q: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    required: ['organisationId'],
    additionalProperties: false,
  },
},
] as const;
