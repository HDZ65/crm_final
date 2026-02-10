import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
export declare class StrictContractDrivenNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    tableName(targetName: string, userSpecifiedName: string | undefined): string;
    columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string;
    relationName(propertyName: string): string;
    joinColumnName(relationName: string, referencedColumnName: string): string;
    joinTableName(firstTableName: string, secondTableName: string, _firstPropertyName: string, _secondPropertyName: string): string;
    joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string;
    classTableInheritanceParentColumnName(parentTableName: string, parentTableIdPropertyName: string): string;
    indexName(tableOrName: string, columnNames: string[], userSpecifiedName?: string): string;
    foreignKeyName(tableOrName: string, columnNames: string[], _referencedTablePath?: string, _referencedColumnNames?: string[]): string;
    primaryKeyName(tableOrName: string, _columnNames: string[]): string;
    uniqueConstraintName(tableOrName: string, columnNames: string[]): string;
}
export declare function validateNoManualMapping(entityMetadata: any): void;
//# sourceMappingURL=strict-naming.strategy.d.ts.map