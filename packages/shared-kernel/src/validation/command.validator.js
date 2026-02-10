"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandValidator = void 0;
const domain_exception_js_1 = require("../exceptions/domain.exception.js");
class CommandValidator {
    static requireField(value, fieldName, entityName = 'Entity') {
        if (value === undefined || value === null || value === '') {
            throw new domain_exception_js_1.InvalidDataException(entityName, `${fieldName} is required`, { field: fieldName });
        }
    }
    static requireOneOf(fields, entityName = 'Entity') {
        const hasValue = Object.entries(fields).some(([_, value]) => value !== undefined && value !== null && value !== '');
        if (!hasValue) {
            const fieldNames = Object.keys(fields).join(' or ');
            throw new domain_exception_js_1.InvalidDataException(entityName, `At least one of ${fieldNames} is required`, { fields: Object.keys(fields) });
        }
    }
    static async ensureUnique(findFn, fieldName, value, entityName = 'Entity') {
        const existing = await findFn();
        if (existing) {
            throw new domain_exception_js_1.AlreadyExistsException(entityName, value, { field: fieldName });
        }
    }
    static validateLength(value, fieldName, options, entityName = 'Entity') {
        if (!value)
            return;
        if (options.min !== undefined && value.length < options.min) {
            throw new domain_exception_js_1.InvalidDataException(entityName, `${fieldName} must be at least ${options.min} characters`, { field: fieldName, minLength: options.min, actualLength: value.length });
        }
        if (options.max !== undefined && value.length > options.max) {
            throw new domain_exception_js_1.InvalidDataException(entityName, `${fieldName} must be at most ${options.max} characters`, { field: fieldName, maxLength: options.max, actualLength: value.length });
        }
    }
    static validateRange(value, fieldName, options, entityName = 'Entity') {
        if (value === undefined || value === null)
            return;
        if (options.min !== undefined && value < options.min) {
            throw new domain_exception_js_1.InvalidDataException(entityName, `${fieldName} must be at least ${options.min}`, { field: fieldName, minValue: options.min, actualValue: value });
        }
        if (options.max !== undefined && value > options.max) {
            throw new domain_exception_js_1.InvalidDataException(entityName, `${fieldName} must be at most ${options.max}`, { field: fieldName, maxValue: options.max, actualValue: value });
        }
    }
    static validateEnum(value, fieldName, allowedValues, entityName = 'Entity') {
        if (!value)
            return;
        if (!allowedValues.includes(value)) {
            throw new domain_exception_js_1.InvalidDataException(entityName, `${fieldName} must be one of: ${allowedValues.join(', ')}`, { field: fieldName, allowedValues, actualValue: value });
        }
    }
}
exports.CommandValidator = CommandValidator;
//# sourceMappingURL=command.validator.js.map