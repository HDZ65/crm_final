"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
const value_object_base_js_1 = require("./value-object.base.js");
class Address extends value_object_base_js_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(props) {
        return new Address({
            street: props.street?.trim() || '',
            city: props.city?.trim() || '',
            postalCode: props.postalCode?.trim() || '',
            country: props.country?.trim() || '',
            complement: props.complement?.trim(),
        });
    }
    getStreet() { return this.props.street; }
    getCity() { return this.props.city; }
    getPostalCode() { return this.props.postalCode; }
    getCountry() { return this.props.country; }
    getComplement() { return this.props.complement; }
    toString() {
        const parts = [this.props.street];
        if (this.props.complement)
            parts.push(this.props.complement);
        parts.push(`${this.props.postalCode} ${this.props.city}`);
        parts.push(this.props.country);
        return parts.join(', ');
    }
    toPrimitives() {
        return { ...this.props };
    }
}
exports.Address = Address;
//# sourceMappingURL=address.vo.js.map