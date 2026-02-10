import { v5 as uuidv5 } from 'uuid';

/**
 * DNS namespace UUID (RFC 4122)
 */
const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generates a deterministic UUIDv5 for an event based on subject and request ID.
 *
 * Ensures that the same event (same subject + requestId combination)
 * always produces the same UUID, enabling idempotent event processing.
 */
export function deterministicEventId(subject: string, requestId: string): string {
  const name = `crm.events|${subject}|${requestId}`;
  return uuidv5(name, DNS_NAMESPACE);
}
