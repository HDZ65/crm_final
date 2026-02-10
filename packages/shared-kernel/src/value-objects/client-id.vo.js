"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class ClientId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'ClientId');
        return new ClientId(value);
    }
}
exports.ClientId = ClientId;
//# sourceMappingURL=client-id.vo.js.map