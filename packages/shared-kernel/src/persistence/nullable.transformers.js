"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullableJsonTransformer = exports.nullableBigintTransformer = exports.nullableNumberTransformer = exports.nullableStringTransformer = void 0;
exports.nullableStringTransformer = {
    to: (value) => (value === undefined ? null : value),
    from: (value) => (value === null ? undefined : value),
};
exports.nullableNumberTransformer = {
    to: (value) => (value === undefined ? null : value),
    from: (value) => (value === null ? undefined : value),
};
exports.nullableBigintTransformer = {
    to: (value) => (value === undefined ? null : String(value)),
    from: (value) => (value === null ? undefined : Number(value)),
};
exports.nullableJsonTransformer = {
    to: (value) => value === undefined ? null : JSON.stringify(value),
    from: (value) => {
        if (value === null)
            return undefined;
        try {
            return JSON.parse(value);
        }
        catch {
            return undefined;
        }
    },
};
//# sourceMappingURL=nullable.transformers.js.map