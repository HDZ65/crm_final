import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { connect, NatsConnection, Subscription, StringCodec, JSONCodec, JetStreamClient, JetStreamManager } from 'nats';
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

  constructor(
    @Inject(NATS_OPTIONS) private readonly config: NatsConfig,
  ) {}

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

        this.logger.log(`Connected to NATS server(s): ${Array.isArray(this.config.servers) ? this.config.servers.join(', ') : this.config.servers}`);

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
    this.connection!.publish(subject, payload);
    this.logger.debug(`Published message to ${subject}`);
  }

  async publishProto<T>(subject: string, data: T, messageType: ProtobufMessage): Promise<void> {
    this.ensureConnection();
    const payload = messageType.encode(data).finish();
    this.connection!.publish(subject, payload);
    this.logger.debug(`Published protobuf message to ${subject}`);
  }

  async publishString(subject: string, data: string): Promise<void> {
    this.ensureConnection();
    const payload = this.stringCodec.encode(data);
    this.connection!.publish(subject, payload);
    this.logger.debug(`Published string message to ${subject}`);
  }

  async subscribe<T = unknown>(subject: string, handler: MessageHandler<T>): Promise<Subscription> {
    this.ensureConnection();
    const sub = this.connection!.subscribe(subject, { queue: this.config.queue });
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
    const sub = this.connection!.subscribe(subject, { queue: this.config.queue });
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
    const sub = this.connection!.subscribe(subject, { queue: this.config.queue });
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

  async request<TReq, TRes>(subject: string, data: TReq, timeout = 5000): Promise<TRes> {
    this.ensureConnection();
    const payload = this.jsonCodec.encode(data);
    const response = await this.connection!.request(subject, payload, { timeout });
    return this.jsonCodec.decode(response.data) as TRes;
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

    (async () => {
      for await (const status of this.connection!.status()) {
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
