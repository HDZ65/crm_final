/**
 * Test preload script for bun.
 *
 * bun's transpiler does not support emitDecoratorMetadata, which means
 * TypeORM's @Column() without an explicit `type` option will crash because
 * Reflect.getMetadata('design:type', ...) returns undefined.
 *
 * This script patches Reflect.getMetadata to return String as a fallback
 * when 'design:type' metadata is missing, allowing TypeORM entities with
 * bare @Column() to load under bun test.
 */
import 'reflect-metadata';

const originalGetMetadata = Reflect.getMetadata.bind(Reflect);

Reflect.getMetadata = function (metadataKey: string, target: unknown, propertyKey?: string | symbol): unknown {
  const result = propertyKey !== undefined
    ? originalGetMetadata(metadataKey, target, propertyKey)
    : originalGetMetadata(metadataKey, target);

  // When bun doesn't emit design:type metadata, default to String
  // so TypeORM Column decorator doesn't throw ColumnTypeUndefinedError
  if (metadataKey === 'design:type' && result === undefined) {
    return String;
  }

  return result;
};
