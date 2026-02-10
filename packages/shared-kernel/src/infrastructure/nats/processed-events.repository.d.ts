import { Repository } from 'typeorm';
import { ProcessedEvent } from './processed-events.entity.js';
export declare class ProcessedEventsRepository {
    private readonly repository;
    constructor(repository: Repository<ProcessedEvent>);
    exists(eventId: string): Promise<boolean>;
    markProcessed(eventId: string, eventType: string): Promise<void>;
    cleanupExpired(): Promise<number>;
}
//# sourceMappingURL=processed-events.repository.d.ts.map