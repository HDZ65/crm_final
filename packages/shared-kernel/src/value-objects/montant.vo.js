"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Montant = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
const index_js_1 = require("../exceptions/index.js");
class Montant extends value_object_base_js_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(value, currency = 'EUR') {
        if (isNaN(value)) {
            throw new index_js_1.InvalidDataException('Montant', 'Montant must be a valid number', { value });
        }
        return new Montant({ value, currency });
    }
    static fromString(raw, currency = 'EUR') {
        const parsed = parseFloat(raw);
        if (isNaN(parsed)) {
            throw new index_js_1.InvalidDataException('Montant', `Invalid montant string: "${raw}"`, { value: raw });
        }
        return new Montant({ value: parsed, currency });
    }
    static zero(currency = 'EUR') {
        return new Montant({ value: 0, currency });
    }
    getValue() {
        return this.props.value;
    }
    getCurrency() {
        return this.props.currency;
    }
    toString() {
        return this.props.value.toFixed(2);
    }
    add(other) {
        this.ensureSameCurrency(other);
        return Montant.create(this.props.value + other.props.value, this.props.currency);
    }
    subtract(other) {
        this.ensureSameCurrency(other);
        return Montant.create(this.props.value - other.props.value, this.props.currency);
    }
    multiply(factor) {
        return Montant.create(this.props.value * factor, this.props.currency);
    }
    isPositive() {
        return this.props.value > 0;
    }
    isNegative() {
        return this.props.value < 0;
    }
    isZero() {
        return this.props.value === 0;
    }
    ensureSameCurrency(other) {
        if (this.props.currency !== other.props.currency) {
            throw new index_js_1.InvalidDataException('Montant', `Cannot operate on different currencies: ${this.props.currency} vs ${other.props.currency}`, { currency1: this.props.currency, currency2: other.props.currency });
        }
    }
}
exports.Montant = Montant;
//# sourceMappingURL=montant.vo.js.map