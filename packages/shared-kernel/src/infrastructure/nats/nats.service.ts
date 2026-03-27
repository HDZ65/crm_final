import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, JetStreamClient, JetStreamManager, JSONCodec, NatsConnection, StringCodec, Subscription } from 'nats';
import { NATS_OPTIONS } from './nats.constants.js';

export interface NatsConfig {
  servers: string | string[];
  queue?: string;
  maxReconnectAttempts?: number;
  reconnectTimeWait?: number;
  name?: string;
}

export type MessageHandler<T = unknown> = (data: T, subject: string) => void | Promise<void>;

export interface ProtobufMessage {
  encode(message: unknown): { finish(): Uint8Array };
  decode(data: Uint8Array): unknown;
}

export interface RequestOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Number of retry attempts on timeout/error (default: 0) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
}

/**
 * Error thrown when a remote service responds with a business error via subscribeAndReply.
 * These errors are NOT retried by request() - only network/timeout errors are retried.
 */
export class NatsRemoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NatsRemoteError';
  }
}

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsService.name);
  private connection: NatsConnection | null = null;
  private jetstream: JetStreamClient | null = null;
  private jetstreamManager: JetStreamManager | null = null;
  private subscriptions: Subscription[] = [];
  private readonly stringCodec = StringCodec();
  private readonly jsonCodec = JSONCodec();
  private reconnectAttempts = 0;

  constructor(@Inject(NATS_OPTIONS) private readonly config: NatsConfig) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    const maxAttempts = this.config.maxReconnectAttempts ?? 10;
    const reconnectWait = this.config.reconnectTimeWait ?? 2000;

    while (this.reconnectAttempts < maxAttempts) {
      try {
        this.connection = await connect({
          servers: this.config.servers,
          name: this.config.name ?? 'crm-service',
          maxReconnectAttempts: maxAttempts,
          reconnectTimeWait: reconnectWait,
        });

        this.logger.log(
          `Connected to NATS server(s): ${Array.isArray(this.config.servers) ? this.config.servers.join(', ') : this.config.servers}`,
        );

        this.jetstream = this.connection.jetstream();
        this.jetstreamManager = await this.connection.jetstreamManager();
        this.setupConnectionHandlers();

        this.reconnectAttempts = 0;
        return;
      } catch (error) {
        this.reconnectAttempts++;
        this.logger.warn(`Failed to connect to NATS (attempt ${this.reconnectAttempts}/${maxAttempts}): ${error}`);

        if (this.reconnectAttempts >= maxAttempts) {
          this.logger.error('Max reconnection attempts reached. Giving up.');
          throw error;
        }

        await this.delay(reconnectWait);
      }
    }
  }

  async disconnect(): Promise<void> {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];

    if (this.connection) {
      await this.connection.drain();
      this.connection = null;
      this.jetstream = null;
      this.jetstreamManager = null;
      this.logger.log('Disconnected from NATS');
    }
  }

  async publish<T>(subject: string, data: T): Promise<void> {
    this.ensureConnection();
    const payload = this.jsonCodec.encode(data);
    this.connection?.publish(subject, payload);
    this.logger.debug(`Published message to ${subject}`);
  }

  async publishProto<T>(subject: string, data: T, messageType: ProtobufMessage): Promise<void> {
    this.ensureConnection();
    const payload = messageType.encode(data).finish();
    this.connection?.publish(subject, payload);
    this.logger.debug(`Published protobuf message to ${subject}`);
  }

  async publishString(subject: string, data: string): Promise<void> {
    this.ensureConnection();
    const payload = this.stringCodec.encode(data);
    this.connection?.publish(subject, payload);
    this.logger.debug(`Published string message to ${subject}`);
  }

  async subscribe<T = unknown>(subject: string, handler: MessageHandler<T>): Promise<Subscription> {
    this.ensureConnection();
    const sub = this.connection?.subscribe(subject, { queue: this.config.queue });
    if (!sub) {
      throw new Error(`Failed to subscribe to ${subject}: connection unavailable`);
    }
    this.subscriptions.push(sub);
    this.logger.log(`Subscribed to ${subject}${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`);

    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.jsonCodec.decode(msg.data) as T;
          await handler(data, msg.subject);
        } catch (error) {
          this.logger.error(`Error processing message from ${msg.subject}: ${error}`);
        }
      }
    })();

    return sub;
  }

  async subscribeProto<T = unknown>(
    subject: string,
    messageType: ProtobufMessage,
    handler: MessageHandler<T>,
  ): Promise<Subscription> {
    this.ensureConnection();
    const sub = this.connection?.subscribe(subject, { queue: this.config.queue });
    if (!sub) {
      throw new Error(`Failed to subscribe to ${subject}: connection unavailable`);
    }
    this.subscriptions.push(sub);
    this.logger.log(`Subscribed to ${subject} (protobuf)${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`);

    (async () => {
      for await (const msg of sub) {
        try {
          const data = messageType.decode(msg.data) as T;
          await handler(data, msg.subject);
        } catch (error) {
          this.logger.error(`Error processing protobuf message from ${msg.subject}: ${error}`);
        }
      }
    })();

    return sub;
  }

  async subscribeString(subject: string, handler: MessageHandler<string>): Promise<Subscription> {
    this.ensureConnection();
    const sub = this.connection?.subscribe(subject, { queue: this.config.queue });
    if (!sub) {
      throw new Error(`Failed to subscribe to ${subject}: connection unavailable`);
    }
    this.subscriptions.push(sub);
    this.logger.log(`Subscribed to ${subject} (string)${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`);

    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.stringCodec.decode(msg.data);
          await handler(data, msg.subject);
        } catch (error) {
          this.logger.error(`Error processing string message from ${msg.subject}: ${error}`);
        }
      }
    })();

    return sub;
  }

  /**
   * Subscribe to a subject and respond to requests (request-reply pattern).
   * The handler must return the response data. Errors are wrapped and sent back to the caller.
   */
  async subscribeAndReply<TReq = unknown, TRes = unknown>(
    subject: string,
    handler: (data: TReq, subject: string) => TRes | Promise<TRes>,
  ): Promise<Subscription> {
    this.ensureConnection();
    const sub = this.connection?.subscribe(subject, { queue: this.config.queue });
    if (!sub) {
      throw new Error(`Failed to subscribe to ${subject}: connection unavailable`);
    }
    this.subscriptions.push(sub);
    this.logger.log(
      `Subscribed to ${subject} (request-reply)${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`,
    );

    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.jsonCodec.decode(msg.data) as TReq;
          const response = await handler(data, msg.subject);
          if (msg.reply) {
            msg.respond(this.jsonCodec.encode({ __ok: true, data: response }));
          }
        } catch (error) {
          this.logger.error(`Error processing request-reply from ${msg.subject}: ${error}`);
          if (msg.reply) {
            msg.respond(
              this.jsonCodec.encode({
                __ok: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            );
          }
        }
      }
    })();

    return sub;
  }

  async request<TReq, TRes>(subject: string, data: TReq, options?: RequestOptions | number): Promise<TRes> {
    this.ensureConnection();

    // Backward compatibility: if options is a number, treat it as timeout
    const opts: RequestOptions = typeof options === 'number' ? { timeout: options } : (options ?? {});

    const timeout = opts.timeout ?? 5000;
    const retries = opts.retries ?? 0;
    const retryDelay = opts.retryDelay ?? 1000;

    const payload = this.jsonCodec.encode(data);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.connection?.request(subject, payload, { timeout });
        if (!response) {
          throw new Error(`No response received from ${subject}: connection unavailable`);
        }
        const raw = this.jsonCodec.decode(response.data) as
          | { __ok: true; data: TRes }
          | { __ok: false; error: string }
          | TRes;

        // Detect wrapped response from subscribeAndReply
        if (raw && typeof raw === 'object' && '__ok' in raw) {
          if (!raw.__ok) {
            // Business error from remote service - throw immediately, NO retry
            throw new NatsRemoteError((raw as { error: string }).error || 'Remote service error');
          }
          return (raw as { data: TRes }).data;
        }

        // Backward compat: raw response without wrapper
        return raw as TRes;
      } catch (error) {
        // Business error from remote - rethrow immediately, no retry
        if (error instanceof NatsRemoteError) {
          throw error;
        }

        // Network/timeout error - retry if attempts remaining
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          this.logger.warn(
            `Request to ${subject} failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}. Retrying in ${retryDelay}ms...`,
          );
          await this.delay(retryDelay);
        }
      }
    }

    this.logger.error(`Request to ${subject} failed after ${retries + 1} attempt(s): ${lastError?.message}`);
    throw lastError;
  }

  getJetStream(): JetStreamClient {
    this.ensureConnection();
    if (!this.jetstream) throw new Error('JetStream client not initialized');
    return this.jetstream;
  }

  getJetStreamManager(): JetStreamManager {
    this.ensureConnection();
    if (!this.jetstreamManager) throw new Error('JetStream manager not initialized');
    return this.jetstreamManager;
  }

  isConnected(): boolean {
    return this.connection !== null && !this.connection.isClosed();
  }

  private ensureConnection(): void {
    if (!this.connection || this.connection.isClosed()) {
      throw new Error('Not connected to NATS server');
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    const connection = this.connection;
    (async () => {
      for await (const status of connection.status()) {
        switch (status.type) {
          case 'disconnect':
            this.logger.warn('Disconnected from NATS');
            break;
          case 'reconnect':
            this.logger.log('Reconnected to NATS');
            break;
          case 'error':
            this.logger.error(`NATS error: ${status.data}`);
            break;
          case 'ldm':
            this.logger.warn('NATS server signaled LDM (lame duck mode)');
            break;
        }
      }
    })();

    this.connection.closed().then((err) => {
      if (err) {
        this.logger.error(`NATS connection closed with error: ${err.message}`);
      } else {
        this.logger.log('NATS connection closed');
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
