"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommercialId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class CommercialId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'CommercialId');
        return new CommercialId(value);
    }
}
exports.CommercialId = CommercialId;
//# sourceMappingURL=commercial-id.vo.js.map