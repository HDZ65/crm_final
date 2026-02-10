"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phone = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
const index_js_1 = require("../exceptions/index.js");
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
class Phone extends value_object_base_js_1.StringValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        const normalized = (0, value_object_base_js_1.normalizeStringValue)(value, {
            fieldName: 'Phone',
            maxLength: 20,
        });
        if (!PHONE_REGEX.test(normalized)) {
            throw new index_js_1.InvalidDataException('Phone', 'Invalid phone number format', { value: normalized });
        }
        return new Phone(normalized);
    }
}
exports.Phone = Phone;
//# sourceMappingURL=phone.vo.js.map