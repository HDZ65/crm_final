export declare class DomainException extends Error {
    readonly code: string;
    readonly metadata?: Record<string, any> | undefined;
    constructor(message: string, code: string, metadata?: Record<string, any> | undefined);
    toJSON(): {
        name: string;
        message: string;
        code: string;
        metadata: Record<string, any> | undefined;
        stack: string | undefined;
    };
}
export declare class NotFoundException extends DomainException {
    constructor(entityName: string, identifier: string | Record<string, any>, metadata?: Record<string, any>);
}
export declare class AlreadyExistsException extends DomainException {
    constructor(entityName: string, identifier: string | Record<string, any>, metadata?: Record<string, any>);
}
export declare class InvalidDataException extends DomainException {
    constructor(entityName: string, reason: string, metadata?: Record<string, any>);
}
export declare class BusinessRuleException extends DomainException {
    constructor(rule: string, reason: string, metadata?: Record<string, any>);
}
export declare class VersionConflictException extends DomainException {
    constructor(entityName: string, identifier: string, expectedVersion: number, actualVersion: number, metadata?: Record<string, any>);
}
export declare class UnauthorizedException extends DomainException {
    constructor(operation: string, reason: string, metadata?: Record<string, any>);
}
//# sourceMappingURL=domain.exception.d.ts.map