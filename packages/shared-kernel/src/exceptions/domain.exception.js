"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = exports.VersionConflictException = exports.BusinessRuleException = exports.InvalidDataException = exports.AlreadyExistsException = exports.NotFoundException = exports.DomainException = void 0;
class DomainException extends Error {
    code;
    metadata;
    constructor(message, code, metadata) {
        super(message);
        this.code = code;
        this.metadata = metadata;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            metadata: this.metadata,
            stack: this.stack,
        };
    }
}
exports.DomainException = DomainException;
class NotFoundException extends DomainException {
    constructor(entityName, identifier, metadata) {
        const identifierStr = typeof identifier === 'string'
            ? identifier
            : JSON.stringify(identifier);
        super(`${entityName} with identifier ${identifierStr} not found`, `${entityName.toUpperCase()}_NOT_FOUND`, { entityName, identifier, ...metadata });
    }
}
exports.NotFoundException = NotFoundException;
class AlreadyExistsException extends DomainException {
    constructor(entityName, identifier, metadata) {
        const identifierStr = typeof identifier === 'string'
            ? identifier
            : JSON.stringify(identifier);
        super(`${entityName} with identifier ${identifierStr} already exists`, `${entityName.toUpperCase()}_ALREADY_EXISTS`, { entityName, identifier, ...metadata });
    }
}
exports.AlreadyExistsException = AlreadyExistsException;
class InvalidDataException extends DomainException {
    constructor(entityName, reason, metadata) {
        super(`Invalid ${entityName} data: ${reason}`, `INVALID_${entityName.toUpperCase()}_DATA`, { entityName, reason, ...metadata });
    }
}
exports.InvalidDataException = InvalidDataException;
class BusinessRuleException extends DomainException {
    constructor(rule, reason, metadata) {
        super(`Business rule violated: ${rule} - ${reason}`, 'BUSINESS_RULE_VIOLATION', { rule, reason, ...metadata });
    }
}
exports.BusinessRuleException = BusinessRuleException;
class VersionConflictException extends DomainException {
    constructor(entityName, identifier, expectedVersion, actualVersion, metadata) {
        super(`Version conflict for ${entityName} ${identifier}: expected ${expectedVersion}, found ${actualVersion}`, 'VERSION_CONFLICT', { entityName, identifier, expectedVersion, actualVersion, ...metadata });
    }
}
exports.VersionConflictException = VersionConflictException;
class UnauthorizedException extends DomainException {
    constructor(operation, reason, metadata) {
        super(`Unauthorized to perform ${operation}: ${reason}`, 'UNAUTHORIZED', { operation, reason, ...metadata });
    }
}
exports.UnauthorizedException = UnauthorizedException;
//# sourceMappingURL=domain.exception.js.map