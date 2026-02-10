"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
const index_js_1 = require("../exceptions/index.js");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
class Email extends value_object_base_js_1.StringValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        const normalized = (0, value_object_base_js_1.normalizeStringValue)(value, {
            fieldName: 'Email',
            maxLength: 255,
        }).toLowerCase();
        if (!EMAIL_REGEX.test(normalized)) {
            throw new index_js_1.InvalidDataException('Email', 'Invalid email format', { value: normalized });
        }
        return new Email(normalized);
    }
}
exports.Email = Email;
//# sourceMappingURL=email.vo.js.map