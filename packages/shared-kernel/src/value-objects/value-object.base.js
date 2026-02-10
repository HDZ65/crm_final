"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidValueObject = exports.StringValueObject = exports.ValueObject = void 0;
exports.normalizeStringValue = normalizeStringValue;
exports.validateUuid = validateUuid;
const uuid_1 = require("uuid");
const index_js_1 = require("../exceptions/index.js");
class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        return deepEqual(this.props, vo.props);
    }
}
exports.ValueObject = ValueObject;
class StringValueObject extends ValueObject {
    getValue() {
        return this.props.value;
    }
    toString() {
        return this.props.value;
    }
}
exports.StringValueObject = StringValueObject;
class UuidValueObject extends ValueObject {
    getValue() {
        return this.props.value;
    }
    toString() {
        return this.props.value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this.props.value === other.props.value;
    }
}
exports.UuidValueObject = UuidValueObject;
function normalizeStringValue(raw, { fieldName, maxLength, minLength = 1, allowEmpty = false }) {
    if (raw === undefined || raw === null) {
        throw new index_js_1.InvalidDataException(fieldName, `${fieldName} cannot be null or undefined`, {
            value: raw,
        });
    }
    const trimmed = raw.trim();
    if (!allowEmpty && trimmed.length === 0) {
        throw new index_js_1.InvalidDataException(fieldName, `${fieldName} cannot be empty`, {
            value: raw,
        });
    }
    if (trimmed.length < minLength) {
        throw new index_js_1.InvalidDataException(fieldName, `${fieldName} is too short (min ${minLength} characters)`, { value: raw, minLength });
    }
    if (trimmed.length > maxLength) {
        throw new index_js_1.InvalidDataException(fieldName, `${fieldName} is too long (max ${maxLength} characters)`, { value: raw, maxLength });
    }
    return trimmed;
}
function validateUuid(id, fieldName) {
    const normalized = normalizeStringValue(id, {
        fieldName,
        maxLength: 36,
        minLength: 1,
    });
    if (!(0, uuid_1.validate)(normalized)) {
        throw new index_js_1.InvalidDataException(fieldName, `${fieldName} must be a valid UUID`, { value: normalized });
    }
}
function isObject(value) {
    return value !== null && typeof value === 'object';
}
function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    if (!isObject(a) || !isObject(b)) {
        return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
        return false;
    }
    return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}
//# sourceMappingURL=value-object.base.js.map