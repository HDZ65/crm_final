import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';

/**
 * AuditSubscriber - Automatically populates created_by and modified_by columns
 * 
 * This subscriber intercepts INSERT and UPDATE operations and populates audit columns
 * from the gRPC context metadata (user ID).
 * 
 * The user ID is extracted from the AsyncLocalStorage context set by AuthInterceptor.
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  /**
   * Extract user ID from context
   * In a real implementation, this would come from AsyncLocalStorage or request context
   * For now, we provide a placeholder that can be overridden
   */
  private getUserId(): string | null {
    // TODO: Extract from gRPC metadata context
    // This would typically come from:
    // - AsyncLocalStorage context set by AuthInterceptor
    // - gRPC metadata headers
    // - Request context
    return null;
  }

  /**
   * Intercept INSERT operations
   */
  beforeInsert(event: InsertEvent<any>): void {
    const userId = this.getUserId();
    
    if (userId && event.entity) {
      // Set created_by on insert
      if ('created_by' in event.entity) {
        event.entity.created_by = userId;
      }
      // Also set modified_by on insert
      if ('modified_by' in event.entity) {
        event.entity.modified_by = userId;
      }
    }
  }

  /**
   * Intercept UPDATE operations
   */
  beforeUpdate(event: UpdateEvent<any>): void {
    const userId = this.getUserId();
    
    if (userId && event.entity) {
      // Update modified_by on update
      if ('modified_by' in event.entity) {
        event.entity.modified_by = userId;
      }
    }
  }
}
