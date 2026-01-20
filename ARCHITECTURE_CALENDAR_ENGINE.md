# Architecture Module Calendrier de Prélèvements / Lots

**Version**: 1.0.0  
**Date**: 19 janvier 2026  
**Statut**: Spécification Implémentable

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Définitions métier](#2-définitions-métier)
3. [Calendar Engine - Algorithme](#3-calendar-engine---algorithme)
4. [Priorité des configurations](#4-priorité-des-configurations)
5. [Schéma de données](#5-schéma-de-données)
6. [Interface d'administration](#6-interface-dadministration)
7. [Validation Protobuf](#7-validation-protobuf)
8. [Audit Trail](#8-audit-trail)
9. [Implémentation Backend](#9-implémentation-backend)
10. [Cas d'erreur](#10-cas-derreur)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Module de calcul déterministe et idempotent des dates de prélèvement (`plannedDebitDate`) avec :
- Gestion des lots L1-L4 (fenêtres d'émission hebdomadaires)
- Configuration du jour fixe (ex: débit le 5 de chaque mois)
- Hiérarchie de priorité: **contrat > client > société > défaut système**
- Respect des contraintes calendaires (jours ouvrés, fériés, cutoff)

### 1.2 Principes architecturaux

| Principe | Mise en œuvre |
|----------|---------------|
| **Schema-first** | `proto/calendar/calendar.proto` est la source unique de vérité |
| **Zéro DTO manuel** | Tous les types générés via `buf generate` |
| **Zéro mapping manuel** | `snakeToCamel=true` + `SnakeNamingStrategy` TypeORM |
| **Zéro erreur silencieuse** | Toute ambiguïté → erreur explicite typée |
| **Déterminisme** | Mêmes entrées = même sortie, toujours |
| **Idempotence** | Recalcul identique si paramètres inchangés |
| **Audit complet** | Toute modification tracée avec before/after |

### 1.3 Fichiers clés

```
proto/calendar/calendar.proto     # Schéma Protobuf (source de vérité)
proto/gen/ts/calendar/            # Types TypeScript générés (backend)
proto/gen/ts-frontend/calendar/   # Types TypeScript générés (frontend)
proto/gen/zod/calendar/           # Schémas Zod générés (validation frontend)
```

---

## 2. Définitions métier

### 2.1 Lots L1-L4

Les lots représentent des **fenêtres d'émission** basées sur les semaines du mois :

| Lot | Jours du mois | Comportement |
|-----|---------------|--------------|
| **L1** | 1-7 | Premier jour ouvré entre le 1er et le 7 |
| **L2** | 8-14 | Premier jour ouvré entre le 8 et le 14 |
| **L3** | 15-21 | Premier jour ouvré entre le 15 et le 21 |
| **L4** | 22-fin | Premier jour ouvré entre le 22 et la fin du mois |

**Règle de calcul du lot** :
1. Identifier la fenêtre du lot (ex: L2 = jours 8-14)
2. Trouver le **premier jour ouvré** dans cette fenêtre
3. Appliquer les contraintes de cutoff si nécessaire

### 2.2 Jour fixe

Alternative aux lots : prélèvement à une date fixe chaque mois.

| Paramètre | Valeur | Contrainte |
|-----------|--------|------------|
| `fixed_day` | 1-28 | Limité à 28 pour éviter les problèmes de fin de mois |

**Règle si jour non éligible** : Appliquer la stratégie de report configurée.

### 2.3 Stratégies de report

| Stratégie | Code | Comportement |
|-----------|------|--------------|
| Prochain jour ouvré | `NEXT_BUSINESS_DAY` | Reporter au jour ouvré suivant |
| Jour ouvré précédent | `PREVIOUS_BUSINESS_DAY` | Anticiper au jour ouvré précédent |
| Semaine suivante | `NEXT_WEEK_SAME_DAY` | Reporter de 7 jours (même jour semaine suivante) |

### 2.4 Définition "Jour ouvré"

Un jour est **ouvré** si :
- ❌ N'est PAS un samedi
- ❌ N'est PAS un dimanche
- ❌ N'est PAS un jour férié (selon la zone configurée)
- ❌ N'est PAS un jour de fermeture bancaire (zone spécifique)

---

## 3. Calendar Engine - Algorithme

### 3.1 Algorithme principal

```typescript
function calculatePlannedDebitDate(input: CalculatePlannedDateRequest): CalculatePlannedDateResponse {
  // ÉTAPE 1: Résolution de la configuration
  const config = resolveConfiguration({
    contratId: input.contratId,
    clientId: input.clientId,
    societeId: input.societeId,
    organisationId: input.organisationId,
  });

  // ÉTAPE 2: Calcul de la date cible initiale
  let targetDate: Date;
  
  if (config.mode === DebitDateMode.BATCH) {
    targetDate = calculateBatchTargetDate(
      input.targetYear,
      input.targetMonth,
      config.batch,
    );
  } else if (config.mode === DebitDateMode.FIXED_DAY) {
    targetDate = new Date(input.targetYear, input.targetMonth - 1, config.fixedDay);
  } else {
    throw new CalendarError('INVALID_MODE', 'Mode de calcul non spécifié');
  }

  // ÉTAPE 3: Vérification d'éligibilité
  const eligibility = checkDateEligibility(targetDate, config.holidayZoneId);

  // ÉTAPE 4: Application du décalage si nécessaire
  let finalDate = targetDate;
  let wasShifted = false;
  let shiftReason = '';

  if (!eligibility.isEligible) {
    finalDate = applyShiftStrategy(targetDate, config.shiftStrategy, config.holidayZoneId);
    wasShifted = true;
    shiftReason = eligibility.isWeekend ? 'weekend' : `holiday:${eligibility.holidayName}`;
  }

  // ÉTAPE 5: Vérification cutoff (optionnel)
  if (config.cutoffConfigId) {
    finalDate = applyCutoffConstraint(finalDate, config.cutoffConfigId, input.referenceDate);
  }

  return {
    plannedDebitDate: formatISODate(finalDate),
    originalTargetDate: formatISODate(targetDate),
    wasShifted,
    shiftReason,
    resolvedConfig: config,
  };
}
```

### 3.2 Calcul de la date cible par lot

```typescript
function calculateBatchTargetDate(year: number, month: number, batch: DebitBatch): Date {
  const ranges: Record<DebitBatch, [number, number]> = {
    [DebitBatch.L1]: [1, 7],
    [DebitBatch.L2]: [8, 14],
    [DebitBatch.L3]: [15, 21],
    [DebitBatch.L4]: [22, getLastDayOfMonth(year, month)],
  };

  const [startDay, endDay] = ranges[batch];
  
  // Retourner le premier jour de la fenêtre (sera ajusté si non éligible)
  return new Date(year, month - 1, startDay);
}
```

### 3.3 Vérification d'éligibilité

```typescript
function checkDateEligibility(date: Date, holidayZoneId: string): DateEligibility {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  const holiday = findHoliday(date, holidayZoneId);
  const isHoliday = holiday !== null;

  return {
    isEligible: !isWeekend && !isHoliday,
    isWeekend,
    isHoliday,
    holidayName: holiday?.name ?? '',
    nextEligibleDate: findNextEligibleDate(date, holidayZoneId),
    previousEligibleDate: findPreviousEligibleDate(date, holidayZoneId),
  };
}
```

### 3.4 Application de la stratégie de décalage

```typescript
function applyShiftStrategy(
  date: Date,
  strategy: DateShiftStrategy,
  holidayZoneId: string,
): Date {
  switch (strategy) {
    case DateShiftStrategy.NEXT_BUSINESS_DAY:
      return findNextEligibleDate(date, holidayZoneId);
    
    case DateShiftStrategy.PREVIOUS_BUSINESS_DAY:
      return findPreviousEligibleDate(date, holidayZoneId);
    
    case DateShiftStrategy.NEXT_WEEK_SAME_DAY:
      let shifted = addDays(date, 7);
      // Vérifier récursivement si le nouveau jour est éligible
      const eligibility = checkDateEligibility(shifted, holidayZoneId);
      if (!eligibility.isEligible) {
        // Fallback sur NEXT_BUSINESS_DAY
        shifted = findNextEligibleDate(shifted, holidayZoneId);
      }
      return shifted;
    
    default:
      throw new CalendarError('INVALID_SHIFT_STRATEGY', `Stratégie inconnue: ${strategy}`);
  }
}
```

### 3.5 Contrainte de cutoff

```typescript
function applyCutoffConstraint(
  plannedDate: Date,
  cutoffConfigId: string,
  referenceDate: string,
): Date {
  const cutoff = getCutoffConfiguration(cutoffConfigId);
  const reference = parseISODate(referenceDate);
  
  // Calculer la date limite d'émission
  // plannedDate - J-X = date limite
  const emissionDeadline = subtractBusinessDays(
    plannedDate,
    cutoff.daysBeforeValueDate,
    cutoff.holidayZoneId,
  );

  // Si la date de référence dépasse la deadline, décaler à la prochaine période
  if (reference > emissionDeadline) {
    // Décaler au prochain lot/mois
    throw new CalendarError(
      'CUTOFF_EXCEEDED',
      `Date de référence ${referenceDate} dépasse le cutoff pour ${formatISODate(plannedDate)}`,
    );
  }

  return plannedDate;
}
```

---

## 4. Priorité des configurations

### 4.1 Hiérarchie de résolution

```
┌────────────────────────────────────────────────────────────┐
│                    PRIORITÉ MAXIMALE                        │
│  ┌────────────────────────────────────────────────────────┐│
│  │  ContractDebitConfiguration (contrat_id)               ││
│  └────────────────────────────────────────────────────────┘│
│                           ↓                                 │
│  ┌────────────────────────────────────────────────────────┐│
│  │  ClientDebitConfiguration (client_id)                  ││
│  └────────────────────────────────────────────────────────┘│
│                           ↓                                 │
│  ┌────────────────────────────────────────────────────────┐│
│  │  CompanyDebitConfiguration (societe_id)                ││
│  └────────────────────────────────────────────────────────┘│
│                           ↓                                 │
│  ┌────────────────────────────────────────────────────────┐│
│  │  SystemDebitConfiguration (organisation_id)            ││
│  └────────────────────────────────────────────────────────┘│
│                    PRIORITÉ MINIMALE                        │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Algorithme de résolution

```typescript
function resolveConfiguration(input: ResolveConfigurationInput): ResolvedDebitConfiguration {
  // 1. Chercher config contrat (priorité max)
  if (input.contratId) {
    const contractConfig = findActiveContractConfig(input.contratId);
    if (contractConfig) {
      return {
        appliedLevel: ConfigurationLevel.CONTRACT,
        appliedConfigId: contractConfig.id,
        ...extractConfigFields(contractConfig),
      };
    }
  }

  // 2. Chercher config client
  if (input.clientId) {
    const clientConfig = findActiveClientConfig(input.clientId);
    if (clientConfig) {
      return {
        appliedLevel: ConfigurationLevel.CLIENT,
        appliedConfigId: clientConfig.id,
        ...extractConfigFields(clientConfig),
      };
    }
  }

  // 3. Chercher config société
  if (input.societeId) {
    const companyConfig = findActiveCompanyConfig(input.societeId);
    if (companyConfig) {
      return {
        appliedLevel: ConfigurationLevel.COMPANY,
        appliedConfigId: companyConfig.id,
        ...extractConfigFields(companyConfig),
      };
    }
  }

  // 4. Utiliser config système (fallback obligatoire)
  const systemConfig = getSystemConfig(input.organisationId);
  if (!systemConfig) {
    throw new CalendarError(
      'NO_DEFAULT_CONFIG',
      `Aucune configuration système trouvée pour organisation ${input.organisationId}`,
    );
  }

  return {
    appliedLevel: ConfigurationLevel.SYSTEM_DEFAULT,
    appliedConfigId: systemConfig.id,
    ...extractConfigFields(systemConfig),
  };
}
```

### 4.3 Règles de fallback

| Situation | Comportement | Erreur |
|-----------|--------------|--------|
| Config contrat active trouvée | Utiliser config contrat | - |
| Config contrat inactive | Chercher config client | - |
| Config client active trouvée | Utiliser config client | - |
| Config client inactive | Chercher config société | - |
| Config société active trouvée | Utiliser config société | - |
| Config société inactive | Utiliser config système | - |
| **Config système absente** | **ERREUR** | `NO_DEFAULT_CONFIG` |
| **Config système inactive** | **ERREUR** | `SYSTEM_CONFIG_DISABLED` |

---

## 5. Schéma de données

### 5.1 Modèle relationnel

```sql
-- Zones de jours fériés
CREATE TABLE holiday_zone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL,
    region_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organisation_id, code)
);

-- Jours fériés
CREATE TABLE holiday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_zone_id UUID NOT NULL REFERENCES holiday_zone(id),
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    holiday_type VARCHAR(20) NOT NULL, -- 'PUBLIC', 'BANK', 'REGIONAL', 'COMPANY'
    is_recurring BOOLEAN DEFAULT false,
    recurring_month INT CHECK (recurring_month BETWEEN 1 AND 12),
    recurring_day INT CHECK (recurring_day BETWEEN 1 AND 31),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(holiday_zone_id, date)
);

-- Configuration cutoff
CREATE TABLE cutoff_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    name VARCHAR(100) NOT NULL,
    cutoff_time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Paris',
    days_before_value_date INT NOT NULL DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuration système (défaut organisation)
CREATE TABLE system_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id) UNIQUE,
    default_mode VARCHAR(20) NOT NULL, -- 'BATCH', 'FIXED_DAY'
    default_batch VARCHAR(10), -- 'L1', 'L2', 'L3', 'L4'
    default_fixed_day INT CHECK (default_fixed_day BETWEEN 1 AND 28),
    shift_strategy VARCHAR(30) NOT NULL DEFAULT 'NEXT_BUSINESS_DAY',
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    cutoff_config_id UUID REFERENCES cutoff_configuration(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuration société
CREATE TABLE company_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    societe_id UUID NOT NULL REFERENCES societe(id),
    mode VARCHAR(20) NOT NULL,
    batch VARCHAR(10),
    fixed_day INT CHECK (fixed_day BETWEEN 1 AND 28),
    shift_strategy VARCHAR(30) NOT NULL,
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    cutoff_config_id UUID REFERENCES cutoff_configuration(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(societe_id)
);

-- Configuration client
CREATE TABLE client_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    client_id UUID NOT NULL REFERENCES client_base(id),
    mode VARCHAR(20) NOT NULL,
    batch VARCHAR(10),
    fixed_day INT CHECK (fixed_day BETWEEN 1 AND 28),
    shift_strategy VARCHAR(30) NOT NULL,
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id)
);

-- Configuration contrat (priorité max)
CREATE TABLE contract_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    contrat_id UUID NOT NULL REFERENCES contrat(id),
    mode VARCHAR(20) NOT NULL,
    batch VARCHAR(10),
    fixed_day INT CHECK (fixed_day BETWEEN 1 AND 28),
    shift_strategy VARCHAR(30) NOT NULL,
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contrat_id)
);

-- Prélèvements planifiés
CREATE TABLE planned_debit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    societe_id UUID NOT NULL REFERENCES societe(id),
    client_id UUID NOT NULL REFERENCES client_base(id),
    contrat_id UUID NOT NULL REFERENCES contrat(id),
    schedule_id UUID REFERENCES schedule(id),
    facture_id UUID REFERENCES facture(id),
    planned_debit_date DATE NOT NULL,
    original_target_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    batch VARCHAR(10),
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    resolved_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_planned_debit_date (organisation_id, planned_debit_date),
    INDEX idx_planned_debit_status (organisation_id, status)
);

-- Prévisions de volumes
CREATE TABLE volume_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    societe_id UUID REFERENCES societe(id),
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    batch VARCHAR(10),
    expected_transaction_count INT NOT NULL DEFAULT 0,
    expected_amount_cents BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    actual_transaction_count INT,
    actual_amount_cents BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organisation_id, societe_id, year, month, day, batch)
);

-- Seuils d'alerte
CREATE TABLE volume_threshold (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    societe_id UUID REFERENCES societe(id),
    max_transaction_count INT,
    max_amount_cents BIGINT,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    alert_on_exceed BOOLEAN DEFAULT true,
    alert_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE calendar_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisation(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    actor_user_id UUID,
    source VARCHAR(20) NOT NULL, -- 'UI', 'CSV_IMPORT', 'API', 'SYSTEM'
    before_state JSONB,
    after_state JSONB,
    change_summary TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (organisation_id, entity_type, entity_id),
    INDEX idx_audit_date (organisation_id, created_at DESC)
);
```

### 5.2 Index de performance

```sql
-- Index pour la résolution de configuration
CREATE INDEX idx_contract_config_lookup ON contract_debit_configuration(contrat_id) WHERE is_active = true;
CREATE INDEX idx_client_config_lookup ON client_debit_configuration(client_id) WHERE is_active = true;
CREATE INDEX idx_company_config_lookup ON company_debit_configuration(societe_id) WHERE is_active = true;

-- Index pour la vérification des jours fériés
CREATE INDEX idx_holiday_date_lookup ON holiday(holiday_zone_id, date) WHERE is_active = true;
CREATE INDEX idx_holiday_recurring ON holiday(holiday_zone_id, recurring_month, recurring_day) WHERE is_recurring = true AND is_active = true;

-- Index pour la vue calendrier
CREATE INDEX idx_planned_debit_calendar ON planned_debit(organisation_id, planned_debit_date, batch);
```

---

## 6. Interface d'administration

### 6.1 Vue Calendrier

**Fonctionnalités** :
- Affichage jour/semaine/mois
- Code couleur par lot (L1-L4)
- Indicateurs visuels : jours fériés, weekends, dates non éligibles
- Volumes agrégés par jour
- Drill-down : clic sur une date → liste des prélèvements

**Filtres** :
- Société(s)
- Lot(s) (L1, L2, L3, L4)
- Période (date début/fin)
- Statut (planifié, confirmé, exécuté, échoué)

**Actions** :
- Export CSV des prélèvements filtrés
- Recalcul d'une date (si paramètres modifiés)

### 6.2 Import CSV

**Types d'import** :
1. `DEBIT_CONFIG` - Configuration des lots par entité
2. `HOLIDAYS` - Jours fériés personnalisés
3. `VOLUME_FORECAST` - Prévisions de volumes

**Workflow obligatoire** :
```
Upload CSV → Validation → Dry-run (prévisualisation) → Confirmation → Application
```

**Format CSV - Configuration lots** :
```csv
entity_type,entity_id,mode,batch,fixed_day,shift_strategy,holiday_zone_code
CONTRACT,uuid-123,BATCH,L2,,NEXT_BUSINESS_DAY,FR
CLIENT,uuid-456,FIXED_DAY,,15,PREVIOUS_BUSINESS_DAY,FR
COMPANY,uuid-789,BATCH,L1,,NEXT_BUSINESS_DAY,FR-ALS
```

**Validation stricte** :
- Colonnes obligatoires présentes
- Types de données corrects
- Références (entity_id, holiday_zone_code) existantes
- Valeurs enum valides
- `fixed_day` entre 1 et 28

**Rapport d'erreurs** :
```json
{
  "errors": [
    {
      "rowNumber": 3,
      "columnName": "fixed_day",
      "value": "31",
      "errorCode": "INVALID_RANGE",
      "errorMessage": "fixed_day doit être entre 1 et 28"
    },
    {
      "rowNumber": 5,
      "columnName": "entity_id",
      "value": "uuid-invalid",
      "errorCode": "ENTITY_NOT_FOUND",
      "errorMessage": "Contrat uuid-invalid non trouvé"
    }
  ]
}
```

### 6.3 Heatmap des volumes

**Affichage** :
- Grille calendaire avec intensité colorée
- Légende : LOW (vert) → MEDIUM (jaune) → HIGH (orange) → CRITICAL (rouge)
- Comparaison prévision vs réel (si disponible)

**Calcul d'intensité** :
```typescript
function calculateIntensity(count: number, threshold: VolumeThreshold): IntensityLevel {
  if (!threshold) return 'LOW';
  
  const ratio = count / threshold.maxTransactionCount;
  
  if (ratio < 0.5) return 'LOW';
  if (ratio < 0.75) return 'MEDIUM';
  if (ratio < 1.0) return 'HIGH';
  return 'CRITICAL'; // Dépassement
}
```

**Alertes** :
- Email automatique si seuil dépassé
- Badge visuel sur les cellules dépassées
- Drill-down vers les prélèvements concernés

---

## 7. Validation Protobuf

### 7.1 Règles de validation (buf.validate)

```protobuf
// À ajouter dans calendar.proto avec import buf/validate/validate.proto

message CreateContractConfigRequest {
  string organisation_id = 1 [(buf.validate.field).string.uuid = true];
  string contrat_id = 2 [(buf.validate.field).string.uuid = true];
  
  DebitDateMode mode = 3 [(buf.validate.field).enum = {
    defined_only: true,
    not_in: [0] // UNSPECIFIED interdit
  }];
  
  DebitBatch batch = 4; // Requis si mode = BATCH
  
  int32 fixed_day = 5 [(buf.validate.field).int32 = {
    gte: 1,
    lte: 28
  }];
  
  DateShiftStrategy shift_strategy = 6 [(buf.validate.field).enum = {
    defined_only: true,
    not_in: [0]
  }];
  
  string holiday_zone_id = 7 [(buf.validate.field).string.uuid = true];
}

// Validation conditionnelle (CEL)
option (buf.validate.message).cel = {
  id: "mode_batch_requires_batch",
  message: "batch est requis quand mode = BATCH",
  expression: "this.mode != 1 || this.batch != 0" // mode BATCH => batch défini
};

option (buf.validate.message).cel = {
  id: "mode_fixed_requires_day",
  message: "fixed_day est requis quand mode = FIXED_DAY",
  expression: "this.mode != 2 || this.fixed_day > 0" // mode FIXED_DAY => fixed_day > 0
};
```

### 7.2 Validation côté Backend (NestJS)

```typescript
// calendar-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate } from '@bufbuild/protovalidate';
import { CreateContractConfigRequest } from '@proto/gen/ts/calendar/calendar';

@Injectable()
export class CalendarValidationPipe implements PipeTransform {
  async transform(value: unknown): Promise<CreateContractConfigRequest> {
    const violations = await validate(CreateContractConfigRequest, value);
    
    if (violations.length > 0) {
      throw new BadRequestException({
        errorCode: 'VALIDATION_FAILED',
        message: 'Données invalides',
        violations: violations.map(v => ({
          field: v.fieldPath,
          constraint: v.constraintId,
          message: v.message,
        })),
      });
    }
    
    return value as CreateContractConfigRequest;
  }
}
```

### 7.3 Validation côté Frontend (Zod généré)

```typescript
// Utilisation du schéma Zod généré depuis proto
import { CreateContractConfigRequestSchema } from '@proto/gen/zod/calendar/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function ContractConfigForm() {
  const form = useForm({
    resolver: zodResolver(CreateContractConfigRequestSchema),
    defaultValues: {
      mode: 'BATCH',
      batch: 'L1',
      shiftStrategy: 'NEXT_BUSINESS_DAY',
    },
  });

  const onSubmit = async (data: z.infer<typeof CreateContractConfigRequestSchema>) => {
    // data est déjà validé et typé
    await api.createContractConfig(data);
  };
}
```

---

## 8. Audit Trail

### 8.1 Événements audités

| Entité | Actions | Données capturées |
|--------|---------|-------------------|
| `SystemDebitConfiguration` | CREATE, UPDATE | Tous les champs |
| `CompanyDebitConfiguration` | CREATE, UPDATE, DELETE | Tous les champs |
| `ClientDebitConfiguration` | CREATE, UPDATE, DELETE | Tous les champs |
| `ContractDebitConfiguration` | CREATE, UPDATE, DELETE | Tous les champs |
| `HolidayZone` | CREATE, UPDATE, DELETE | Tous les champs |
| `Holiday` | CREATE, UPDATE, DELETE | Tous les champs |
| `VolumeThreshold` | CREATE, UPDATE, DELETE | Tous les champs |
| `CsvImport` | IMPORT_STARTED, IMPORT_CONFIRMED | Fichier, résultats |

### 8.2 Structure d'un enregistrement d'audit

```json
{
  "id": "audit-uuid-123",
  "organisationId": "org-uuid",
  "entityType": "ContractDebitConfiguration",
  "entityId": "config-uuid-456",
  "action": "UPDATE",
  "actorUserId": "user-uuid-789",
  "source": "UI",
  "beforeState": {
    "mode": "BATCH",
    "batch": "L1",
    "shiftStrategy": "NEXT_BUSINESS_DAY"
  },
  "afterState": {
    "mode": "FIXED_DAY",
    "fixedDay": 15,
    "shiftStrategy": "PREVIOUS_BUSINESS_DAY"
  },
  "changeSummary": "Mode changé de BATCH(L1) vers FIXED_DAY(15). Stratégie changée de NEXT_BUSINESS_DAY vers PREVIOUS_BUSINESS_DAY.",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-01-19T15:30:00Z"
}
```

### 8.3 Implémentation

```typescript
// audit.interceptor.ts
@Injectable()
export class CalendarAuditInterceptor implements NestInterceptor {
  constructor(private auditService: CalendarAuditService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const auditMetadata = Reflect.getMetadata('audit', handler);

    if (!auditMetadata) {
      return next.handle();
    }

    const beforeState = auditMetadata.getBeforeState 
      ? await auditMetadata.getBeforeState(request)
      : null;

    return next.handle().pipe(
      tap(async (result) => {
        await this.auditService.log({
          organisationId: request.organisationId,
          entityType: auditMetadata.entityType,
          entityId: result.id,
          action: auditMetadata.action,
          actorUserId: request.user?.id,
          source: this.determineSource(request),
          beforeState,
          afterState: result,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
```

---

## 9. Implémentation Backend

### 9.1 Structure du module

```
service-calendar/
├── src/
│   ├── modules/
│   │   └── calendar/
│   │       ├── calendar.module.ts
│   │       ├── services/
│   │       │   ├── calendar-engine.service.ts      # Calcul des dates
│   │       │   ├── configuration-resolver.service.ts # Résolution priorité
│   │       │   ├── holiday.service.ts              # Gestion jours fériés
│   │       │   ├── csv-import.service.ts           # Import CSV
│   │       │   └── audit.service.ts                # Audit trail
│   │       ├── controllers/
│   │       │   ├── calendar-engine.controller.ts
│   │       │   ├── configuration.controller.ts
│   │       │   ├── holiday.controller.ts
│   │       │   └── admin.controller.ts
│   │       ├── repositories/
│   │       │   └── (TypeORM repositories - générés depuis proto)
│   │       └── grpc/
│   │           └── calendar.grpc.controller.ts     # Endpoints gRPC
│   └── main.ts
└── package.json
```

### 9.2 Configuration TypeORM

```typescript
// data-source.ts
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: 'calendar_service',
  namingStrategy: new SnakeNamingStrategy(), // Conversion auto camelCase ↔ snake_case
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
```

### 9.3 Service principal

```typescript
// calendar-engine.service.ts
@Injectable()
export class CalendarEngineService {
  constructor(
    private configResolver: ConfigurationResolverService,
    private holidayService: HolidayService,
    private cutoffService: CutoffService,
  ) {}

  async calculatePlannedDate(
    request: CalculatePlannedDateRequest,
  ): Promise<CalculatePlannedDateResponse> {
    // 1. Résoudre la configuration
    const config = await this.configResolver.resolve({
      contratId: request.contratId,
      clientId: request.clientId,
      societeId: request.societeId,
      organisationId: request.organisationId,
    });

    // 2. Calculer la date cible
    const targetDate = this.calculateTargetDate(
      request.targetYear,
      request.targetMonth,
      config,
    );

    // 3. Vérifier l'éligibilité
    const eligibility = await this.holidayService.checkEligibility(
      targetDate,
      config.holidayZoneId,
    );

    // 4. Appliquer le décalage si nécessaire
    let finalDate = targetDate;
    let wasShifted = false;
    let shiftReason = '';

    if (!eligibility.isEligible) {
      finalDate = await this.applyShiftStrategy(
        targetDate,
        config.shiftStrategy,
        config.holidayZoneId,
      );
      wasShifted = true;
      shiftReason = eligibility.reason;
    }

    // 5. Vérifier cutoff
    if (config.cutoffConfigId && request.referenceDate) {
      this.validateCutoff(finalDate, config.cutoffConfigId, request.referenceDate);
    }

    return {
      plannedDebitDate: this.formatDate(finalDate),
      originalTargetDate: this.formatDate(targetDate),
      wasShifted,
      shiftReason,
      resolvedConfig: config,
    };
  }
}
```

---

## 10. Cas d'erreur

### 10.1 Erreurs typées

| Code | Message | Cause | Action |
|------|---------|-------|--------|
| `NO_DEFAULT_CONFIG` | Aucune configuration système | Config système manquante | Créer SystemDebitConfiguration |
| `SYSTEM_CONFIG_DISABLED` | Configuration système désactivée | `is_active = false` | Activer la config |
| `INVALID_MODE` | Mode de calcul non spécifié | `mode = UNSPECIFIED` | Spécifier BATCH ou FIXED_DAY |
| `BATCH_REQUIRED` | Lot requis pour mode BATCH | `mode = BATCH` mais `batch = null` | Spécifier le lot |
| `FIXED_DAY_REQUIRED` | Jour fixe requis pour mode FIXED_DAY | `mode = FIXED_DAY` mais `fixed_day = 0` | Spécifier le jour |
| `FIXED_DAY_OUT_OF_RANGE` | Jour fixe hors limites | `fixed_day < 1` ou `> 28` | Utiliser 1-28 |
| `HOLIDAY_ZONE_NOT_FOUND` | Zone de jours fériés introuvable | Référence invalide | Vérifier l'ID |
| `CUTOFF_EXCEEDED` | Cutoff dépassé | Date référence > deadline | Décaler au mois suivant |
| `NO_ELIGIBLE_DATE_FOUND` | Aucune date éligible trouvée | Tous les jours fériés | Vérifier config fériés |
| `CSV_VALIDATION_FAILED` | Validation CSV échouée | Erreurs dans le fichier | Corriger et réimporter |

### 10.2 Réponse d'erreur standardisée

```typescript
interface CalendarErrorResponse {
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
  violations?: Array<{
    field: string;
    constraint: string;
    message: string;
  }>;
  timestamp: string;
  traceId: string;
}
```

### 10.3 Exemple de réponse d'erreur

```json
{
  "errorCode": "BATCH_REQUIRED",
  "message": "Le lot est requis lorsque le mode est BATCH",
  "details": {
    "mode": "BATCH",
    "batch": null
  },
  "violations": [
    {
      "field": "batch",
      "constraint": "mode_batch_requires_batch",
      "message": "batch est requis quand mode = BATCH"
    }
  ],
  "timestamp": "2026-01-19T15:45:00Z",
  "traceId": "trace-abc123"
}
```

---

## Annexes

### A. Dépendances recommandées

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "date-fns-tz": "^3.0.0",
    "date-holidays": "^3.23.0"
  }
}
```

### B. Librairie jours fériés (date-holidays)

```typescript
import Holidays from 'date-holidays';

const hd = new Holidays('FR');
const holidays2026 = hd.getHolidays(2026);

// Résultat: liste des jours fériés français 2026
// Peut être utilisé pour pré-peupler la table holiday
```

### C. Checklist d'implémentation

- [ ] Créer `proto/calendar/calendar.proto` ✅
- [ ] Ajouter `calendar` dans `proto/buf.yaml`
- [ ] Exécuter `buf generate`
- [ ] Créer migrations SQL
- [ ] Implémenter `CalendarEngineService`
- [ ] Implémenter `ConfigurationResolverService`
- [ ] Implémenter `HolidayService`
- [ ] Implémenter `CsvImportService`
- [ ] Implémenter `CalendarAuditService`
- [ ] Créer contrôleurs gRPC
- [ ] Créer contrôleurs REST (si API Gateway)
- [ ] Tests unitaires Calendar Engine
- [ ] Tests intégration résolution priorité
- [ ] Tests E2E import CSV
- [ ] Documentation API (généré depuis proto)

---

**Auteur**: Architecture Team  
**Reviewers**: Lead Dev, Product Owner  
**Statut**: Prêt pour implémentation
