"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilisateurId = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class UtilisateurId extends value_object_base_js_1.UuidValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        (0, value_object_base_js_1.validateUuid)(value, 'UtilisateurId');
        return new UtilisateurId(value);
    }
}
exports.UtilisateurId = UtilisateurId;
//# sourceMappingURL=utilisateur-id.vo.js.map