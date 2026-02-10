"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProduitId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class ProduitId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'ProduitId');
        return new ProduitId(value);
    }
}
exports.ProduitId = ProduitId;
//# sourceMappingURL=produit-id.vo.js.map