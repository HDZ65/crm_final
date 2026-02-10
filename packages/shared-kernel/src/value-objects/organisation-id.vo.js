"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganisationId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class OrganisationId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'OrganisationId');
        return new OrganisationId(value);
    }
}
exports.OrganisationId = OrganisationId;
//# sourceMappingURL=organisation-id.vo.js.map