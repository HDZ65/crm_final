/**
 * Strict Naming Strategy - Contract-Driven Architecture
 *
 * Database: snake_case ONLY
 * Application code: camelCase ONLY
 * Conversion: AUTOMATIC (no manual mapping)
 */

import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils.js';

export class StrictContractDrivenNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
  }

  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    if (customName && process.env.NODE_ENV !== 'test') {
      console.warn(
        `ANTI-PATTERN DETECTED: Manual column mapping for "${propertyName}"\n` +
          `   @Column({ name: "${customName}" }) is FORBIDDEN\n` +
          `   Use automatic snake_case conversion instead.`,
      );
    }

    const prefix = embeddedPrefixes.length > 0
      ? embeddedPrefixes.join('_') + '_'
      : '';

    return customName
      ? prefix + customName
      : prefix + snakeCase(propertyName);
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName) + '_' + referencedColumnName;
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    _firstPropertyName: string,
    _secondPropertyName: string,
  ): string {
    return snakeCase(firstTableName + '_' + secondTableName);
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return snakeCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  indexName(
    tableOrName: string,
    columnNames: string[],
    userSpecifiedName?: string,
  ): string {
    if (userSpecifiedName) {
      return userSpecifiedName;
    }
    const columns = columnNames.join('_');
    return `ix_${snakeCase(tableOrName)}_${snakeCase(columns)}`;
  }

  foreignKeyName(
    tableOrName: string,
    columnNames: string[],
    _referencedTablePath?: string,
    _referencedColumnNames?: string[],
  ): string {
    const columns = columnNames.join('_');
    return `fk_${snakeCase(tableOrName)}_${snakeCase(columns)}`;
  }

  primaryKeyName(tableOrName: string, _columnNames: string[]): string {
    return `pk_${snakeCase(tableOrName)}`;
  }

  uniqueConstraintName(tableOrName: string, columnNames: string[]): string {
    const columns = columnNames.join('_');
    return `uq_${snakeCase(tableOrName)}_${snakeCase(columns)}`;
  }
}

export function validateNoManualMapping(entityMetadata: any): void {
  const violations: string[] = [];

  for (const column of entityMetadata.columns) {
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
      'MANUAL COLUMN MAPPING DETECTED (FORBIDDEN)\n\n' +
        violations.join('\n\n') +
        '\n\nRemove @Column({ name: "..." }) and rely on automatic snake_case conversion.',
    );
  }
}
