"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrictContractDrivenNamingStrategy = void 0;
exports.validateNoManualMapping = validateNoManualMapping;
const typeorm_1 = require("typeorm");
const StringUtils_js_1 = require("typeorm/util/StringUtils.js");
class StrictContractDrivenNamingStrategy extends typeorm_1.DefaultNamingStrategy {
    tableName(targetName, userSpecifiedName) {
        return userSpecifiedName ? userSpecifiedName : (0, StringUtils_js_1.snakeCase)(targetName);
    }
    columnName(propertyName, customName, embeddedPrefixes) {
        if (customName && process.env.NODE_ENV !== 'test') {
            console.warn(`ANTI-PATTERN DETECTED: Manual column mapping for "${propertyName}"\n` +
                `   @Column({ name: "${customName}" }) is FORBIDDEN\n` +
                `   Use automatic snake_case conversion instead.`);
        }
        const prefix = embeddedPrefixes.length > 0
            ? embeddedPrefixes.join('_') + '_'
            : '';
        return customName
            ? prefix + customName
            : prefix + (0, StringUtils_js_1.snakeCase)(propertyName);
    }
    relationName(propertyName) {
        return (0, StringUtils_js_1.snakeCase)(propertyName);
    }
    joinColumnName(relationName, referencedColumnName) {
        return (0, StringUtils_js_1.snakeCase)(relationName) + '_' + referencedColumnName;
    }
    joinTableName(firstTableName, secondTableName, _firstPropertyName, _secondPropertyName) {
        return (0, StringUtils_js_1.snakeCase)(firstTableName + '_' + secondTableName);
    }
    joinTableColumnName(tableName, propertyName, columnName) {
        return (0, StringUtils_js_1.snakeCase)(tableName + '_' + (columnName ? columnName : propertyName));
    }
    classTableInheritanceParentColumnName(parentTableName, parentTableIdPropertyName) {
        return (0, StringUtils_js_1.snakeCase)(parentTableName + '_' + parentTableIdPropertyName);
    }
    indexName(tableOrName, columnNames, userSpecifiedName) {
        if (userSpecifiedName) {
            return userSpecifiedName;
        }
        const columns = columnNames.join('_');
        return `ix_${(0, StringUtils_js_1.snakeCase)(tableOrName)}_${(0, StringUtils_js_1.snakeCase)(columns)}`;
    }
    foreignKeyName(tableOrName, columnNames, _referencedTablePath, _referencedColumnNames) {
        const columns = columnNames.join('_');
        return `fk_${(0, StringUtils_js_1.snakeCase)(tableOrName)}_${(0, StringUtils_js_1.snakeCase)(columns)}`;
    }
    primaryKeyName(tableOrName, _columnNames) {
        return `pk_${(0, StringUtils_js_1.snakeCase)(tableOrName)}`;
    }
    uniqueConstraintName(tableOrName, columnNames) {
        const columns = columnNames.join('_');
        return `uq_${(0, StringUtils_js_1.snakeCase)(tableOrName)}_${(0, StringUtils_js_1.snakeCase)(columns)}`;
    }
}
exports.StrictContractDrivenNamingStrategy = StrictContractDrivenNamingStrategy;
function validateNoManualMapping(entityMetadata) {
    const violations = [];
    for (const column of entityMetadata.columns) {
        if (column.propertyName &&
            column.databaseName &&
            column.databaseName !== (0, StringUtils_js_1.snakeCase)(column.propertyName)) {
            violations.push(`Entity "${entityMetadata.name}" property "${column.propertyName}" ` +
                `has manual mapping to "${column.databaseName}". ` +
                `Expected automatic: "${(0, StringUtils_js_1.snakeCase)(column.propertyName)}"`);
        }
    }
    if (violations.length > 0) {
        throw new Error('MANUAL COLUMN MAPPING DETECTED (FORBIDDEN)\n\n' +
            violations.join('\n\n') +
            '\n\nRemove @Column({ name: "..." }) and rely on automatic snake_case conversion.');
    }
}
//# sourceMappingURL=strict-naming.strategy.js.map