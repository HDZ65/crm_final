import { ValueObject } from './value-object.base.js';
interface AddressProps {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    complement?: string;
}
export declare class Address extends ValueObject<AddressProps> {
    private constructor();
    static create(props: AddressProps): Address;
    getStreet(): string;
    getCity(): string;
    getPostalCode(): string;
    getCountry(): string;
    getComplement(): string | undefined;
    toString(): string;
    toPrimitives(): AddressProps;
}
export {};
//# sourceMappingURL=address.vo.d.ts.map