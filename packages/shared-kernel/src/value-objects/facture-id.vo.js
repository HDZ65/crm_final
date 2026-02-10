"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactureId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class FactureId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'FactureId');
        return new FactureId(value);
    }
}
exports.FactureId = FactureId;
//# sourceMappingURL=facture-id.vo.js.map