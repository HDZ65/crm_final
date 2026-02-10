/**
 * Domain exceptions with gRPC status code mappings
 */

export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
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

/** Maps to gRPC NOT_FOUND (5) */
export class NotFoundException extends DomainException {
  constructor(
    entityName: string,
    identifier: string | Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    const identifierStr = typeof identifier === 'string'
      ? identifier
      : JSON.stringify(identifier);
    super(
      `${entityName} with identifier ${identifierStr} not found`,
      `${entityName.toUpperCase()}_NOT_FOUND`,
      { entityName, identifier, ...metadata },
    );
  }
}

/** Maps to gRPC ALREADY_EXISTS (6) */
export class AlreadyExistsException extends DomainException {
  constructor(
    entityName: string,
    identifier: string | Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    const identifierStr = typeof identifier === 'string'
      ? identifier
      : JSON.stringify(identifier);
    super(
      `${entityName} with identifier ${identifierStr} already exists`,
      `${entityName.toUpperCase()}_ALREADY_EXISTS`,
      { entityName, identifier, ...metadata },
    );
  }
}

/** Maps to gRPC INVALID_ARGUMENT (3) */
export class InvalidDataException extends DomainException {
  constructor(
    entityName: string,
    reason: string,
    metadata?: Record<string, any>,
  ) {
    super(
      `Invalid ${entityName} data: ${reason}`,
      `INVALID_${entityName.toUpperCase()}_DATA`,
      { entityName, reason, ...metadata },
    );
  }
}

/** Maps to gRPC FAILED_PRECONDITION (9) */
export class BusinessRuleException extends DomainException {
  constructor(
    rule: string,
    reason: string,
    metadata?: Record<string, any>,
  ) {
    super(
      `Business rule violated: ${rule} - ${reason}`,
      'BUSINESS_RULE_VIOLATION',
      { rule, reason, ...metadata },
    );
  }
}

/** Maps to gRPC ABORTED (10) */
export class VersionConflictException extends DomainException {
  constructor(
    entityName: string,
    identifier: string,
    expectedVersion: number,
    actualVersion: number,
    metadata?: Record<string, any>,
  ) {
    super(
      `Version conflict for ${entityName} ${identifier}: expected ${expectedVersion}, found ${actualVersion}`,
      'VERSION_CONFLICT',
      { entityName, identifier, expectedVersion, actualVersion, ...metadata },
    );
  }
}

/** Maps to gRPC PERMISSION_DENIED (7) */
export class UnauthorizedException extends DomainException {
  constructor(
    operation: string,
    reason: string,
    metadata?: Record<string, any>,
  ) {
    super(
      `Unauthorized to perform ${operation}: ${reason}`,
      'UNAUTHORIZED',
      { operation, reason, ...metadata },
    );
  }
}
