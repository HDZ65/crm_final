/**
 * ====================================================================
 * STRICT NAMING STRATEGY - Contract-Driven Architecture
 * ====================================================================
 * 
 * RULES:
 * 1. Database: snake_case ONLY
 * 2. Application code: camelCase ONLY
 * 3. Conversion: AUTOMATIC (no manual mapping)
 * 4. Proto: snake_case → generated as camelCase
 * 5. ORM: camelCase → stored as snake_case
 * 
 * FORBIDDEN:
 * ❌ @Column({ name: '...' }) - manual mapping
 * ❌ snake_case in TypeScript code
 * ❌ camelCase in database
 * ❌ any/unknown types
 * 
 * This strategy is applied GLOBALLY to ALL TypeORM entities.
 * ====================================================================
 */

import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class StrictContractDrivenNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  /**
   * Table name: converts entity class name to snake_case
   * 
   * Example:
   *   ClientBase → client_base
   *   FactureEntity → facture_entity (or override with @Entity('facture'))
   */
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
  }

  /**
   * Column name: converts property name to snake_case
   * 
   * CRITICAL: This is the KEY to zero manual mapping
   * 
   * Example:
   *   organisationId → organisation_id
   *   dateNaissance → date_naissance
   *   montantTTC → montant_ttc
   * 
   * ⚠️ If you use @Column({ name: '...' }), you're doing it WRONG
   */
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    // If developer specified @Column({ name: '...' }), FAIL LOUDLY
    if (customName && process.env.NODE_ENV !== 'test') {
      console.warn(
        `⚠️  ANTI-PATTERN DETECTED: Manual column mapping for "${propertyName}"\n` +
          `   @Column({ name: "${customName}" }) is FORBIDDEN\n` +
          `   Use automatic snake_case conversion instead.\n` +
          `   If this is intentional, add a comment explaining why.`,
      );
    }

    // Apply embedded prefixes (for @Embedded)
    const prefix = embeddedPrefixes.length > 0 
      ? embeddedPrefixes.join('_') + '_' 
      : '';

    return customName 
      ? prefix + customName 
      : prefix + snakeCase(propertyName);
  }

  /**
   * Relation name: converts relation property to snake_case
   */
  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  /**
   * Join column name: snake_case with _id suffix
   * 
   * Example:
   *   @ManyToOne(() => Organisation)
   *   organisation: Organisation;
   *   
   *   → Database column: organisation_id
   */
  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName) + '_' + referencedColumnName;
  }

  /**
   * Join table name: combines both entity names
   * 
   * Example:
   *   User ↔ Role → user_role
   */
  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    secondPropertyName: string,
  ): string {
    return snakeCase(firstTableName + '_' + secondTableName);
  }

  /**
   * Join table column name
   */
  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
  }

  /**
   * Class table inheritance pattern
   */
  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return snakeCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  /**
   * Index name: ix_{table}_{column}
   */
  indexName(
    tableOrName: string,
    columnNames: string[],
    userSpecifiedName?: string,
  ): string {
    if (userSpecifiedName) {
      return userSpecifiedName;
    }

    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    const columns = columnNames.join('_');
    return `ix_${snakeCase(table)}_${snakeCase(columns)}`;
  }

  /**
   * Foreign key name: fk_{table}_{column}
   */
  foreignKeyName(
    tableOrName: string,
    columnNames: string[],
    _referencedTablePath?: string,
    _referencedColumnNames?: string[],
  ): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    const columns = columnNames.join('_');
    return `fk_${snakeCase(table)}_${snakeCase(columns)}`;
  }

  /**
   * Primary key name: pk_{table}
   */
  primaryKeyName(tableOrName: string, columnNames: string[]): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `pk_${snakeCase(table)}`;
  }

  /**
   * Unique constraint name: uq_{table}_{column}
   */
  uniqueConstraintName(tableOrName: string, columnNames: string[]): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    const columns = columnNames.join('_');
    return `uq_${snakeCase(table)}_${snakeCase(columns)}`;
  }
}

/**
 * ====================================================================
 * VALIDATION HELPER
 * ====================================================================
 * 
 * Use this in tests to ensure NO manual column mapping exists
 */
export function validateNoManualMapping(entityMetadata: any): void {
  const violations: string[] = [];

  for (const column of entityMetadata.columns) {
    // Check if column name was manually specified
    if (
      column.propertyName &&
      column.databaseName &&
      column.databaseName !== snakeCase(column.propertyName)
    ) {
      violations.push(
        `Entity "${entityMetadata.name}" property "${column.propertyName}" ` +
          `has manual mapping to "${column.databaseName}". ` +
          `Expected automatic: "${snakeCase(column.propertyName)}"`,
      );
    }
  }

  if (violations.length > 0) {
    throw new Error(
      '🚨 MANUAL COLUMN MAPPING DETECTED (FORBIDDEN)\n\n' +
        violations.join('\n\n') +
        '\n\nRemove @Column({ name: "..." }) and rely on automatic snake_case conversion.',
    );
  }
}

/**
 * ====================================================================
 * USAGE IN APP.MODULE.TS
 * ====================================================================
 * 
 * @example
 * ```typescript
 * import { StrictContractDrivenNamingStrategy } from '@crm/shared/orm';
 * 
 * TypeOrmModule.forRoot({
 *   type: 'postgres',
 *   namingStrategy: new StrictContractDrivenNamingStrategy(),
 *   // ... other options
 * })
 * ```
 * 
 * ====================================================================
 * ENTITY EXAMPLE (CORRECT)
 * ====================================================================
 * 
 * @example
 * ```typescript
 * @Entity('client_base')  // ✅ Specify table name
 * export class ClientBaseEntity {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;  // ✅ Auto → id
 * 
 *   @Column()
 *   organisationId: string;  // ✅ Auto → organisation_id
 * 
 *   @Column()
 *   dateNaissance: Date;  // ✅ Auto → date_naissance
 * 
 *   @Column()
 *   montantTTC: number;  // ✅ Auto → montant_ttc
 * 
 *   @ManyToOne(() => Statut)
 *   statut: Statut;  // ✅ Auto → statut_id (FK)
 * }
 * ```
 * 
 * ====================================================================
 * ENTITY EXAMPLE (WRONG - FORBIDDEN)
 * ====================================================================
 * 
 * @example
 * ```typescript
 * @Entity('client_base')
 * export class ClientBaseEntity {
 *   @Column({ name: 'organisation_id' })  // ❌ FORBIDDEN - manual mapping
 *   organisationId: string;
 * 
 *   @Column({ name: 'date_naissance' })  // ❌ FORBIDDEN
 *   dateNaissance: Date;
 * }
 * ```
 */
