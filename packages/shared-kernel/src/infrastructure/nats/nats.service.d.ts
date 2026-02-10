import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subscription, JetStreamClient, JetStreamManager } from 'nats';
export interface NatsConfig {
    servers: string | string[];
    queue?: string;
    maxReconnectAttempts?: number;
    reconnectTimeWait?: number;
    name?: string;
}
export type MessageHandler<T = unknown> = (data: T, subject: string) => void | Promise<void>;
export interface ProtobufMessage {
    encode(message: unknown): {
        finish(): Uint8Array;
    };
    decode(data: Uint8Array): unknown;
}
export declare class NatsService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private jetstream;
    private jetstreamManager;
    private subscriptions;
    private readonly stringCodec;
    private readonly jsonCodec;
    private reconnectAttempts;
    constructor(config: NatsConfig);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish<T>(subject: string, data: T): Promise<void>;
    publishProto<T>(subject: string, data: T, messageType: ProtobufMessage): Promise<void>;
    publishString(subject: string, data: string): Promise<void>;
    subscribe<T = unknown>(subject: string, handler: MessageHandler<T>): Promise<Subscription>;
    subscribeProto<T = unknown>(subject: string, messageType: ProtobufMessage, handler: MessageHandler<T>): Promise<Subscription>;
    subscribeString(subject: string, handler: MessageHandler<string>): Promise<Subscription>;
    request<TReq, TRes>(subject: string, data: TReq, timeout?: number): Promise<TRes>;
    getJetStream(): JetStreamClient;
    getJetStreamManager(): JetStreamManager;
    isConnected(): boolean;
    private ensureConnection;
    private setupConnectionHandlers;
    private delay;
}
//# sourceMappingURL=nats.service.d.ts.map