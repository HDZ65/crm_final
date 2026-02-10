"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpeditionId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class ExpeditionId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'ExpeditionId');
        return new ExpeditionId(value);
    }
}
exports.ExpeditionId = ExpeditionId;
//# sourceMappingURL=expedition-id.vo.js.map