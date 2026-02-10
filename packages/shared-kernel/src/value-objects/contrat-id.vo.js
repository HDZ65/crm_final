"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContratId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class ContratId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'ContratId');
        return new ContratId(value);
    }
}
exports.ContratId = ContratId;
//# sourceMappingURL=contrat-id.vo.js.map