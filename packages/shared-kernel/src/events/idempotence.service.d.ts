export interface IdempotenceStore {
    isEventProcessed(eventId: string): Promise<boolean>;
    markEventProcessed(eventId: string, eventType: string): Promise<void>;
}
export declare const IDEMPOTENCE_STORE = "IDEMPOTENCE_STORE";
export declare class IdempotenceService {
    private readonly store;
    private readonly logger;
    constructor(store: IdempotenceStore);
    isProcessed(eventId: string | undefined): Promise<boolean>;
    markProcessed(eventId: string | undefined, eventType: string): Promise<void>;
}
//# sourceMappingURL=idempotence.service.d.ts.map