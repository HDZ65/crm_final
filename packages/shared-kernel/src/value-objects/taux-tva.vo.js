"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TauxTva = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
const index_js_1 = require("../exceptions/index.js");
class TauxTva extends value_object_base_js_1.ValueObject {
    constructor(value) {
        super({ value });
    }
    static create(value) {
        if (isNaN(value) || value < 0 || value > 100) {
            throw new index_js_1.InvalidDataException('TauxTva', 'TVA rate must be between 0 and 100', { value });
        }
        return new TauxTva(value);
    }
    getValue() {
        return this.props.value;
    }
    toMultiplier() {
        return 1 + this.props.value / 100;
    }
    toString() {
        return `${this.props.value}%`;
    }
}
exports.TauxTva = TauxTva;
//# sourceMappingURL=taux-tva.vo.js.map