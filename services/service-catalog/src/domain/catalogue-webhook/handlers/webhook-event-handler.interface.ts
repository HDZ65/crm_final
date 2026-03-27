export interface WebhookEventHandler {
  handle(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }>;
}
