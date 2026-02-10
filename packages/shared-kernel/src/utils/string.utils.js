"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelToSnake = camelToSnake;
exports.snakeToCamel = snakeToCamel;
exports.mapRowToCamel = mapRowToCamel;
function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function mapRowToCamel(row) {
    return Object.fromEntries(Object.entries(row).map(([key, value]) => [snakeToCamel(key), value]));
}
//# sourceMappingURL=string.utils.js.map