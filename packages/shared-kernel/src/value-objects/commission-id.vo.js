"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class CommissionId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'CommissionId');
        return new CommissionId(value);
    }
}
exports.CommissionId = CommissionId;
//# sourceMappingURL=commission-id.vo.js.map