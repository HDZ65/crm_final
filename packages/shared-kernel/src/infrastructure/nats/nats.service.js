"use strict";
var NatsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const nats_1 = require("nats");
const nats_constants_js_1 = require("./nats.constants.js");
let NatsService = NatsService_1 = class NatsService {
    config;
    logger = new common_1.Logger(NatsService_1.name);
    connection = null;
    jetstream = null;
    jetstreamManager = null;
    subscriptions = [];
    stringCodec = (0, nats_1.StringCodec)();
    jsonCodec = (0, nats_1.JSONCodec)();
    reconnectAttempts = 0;
    constructor(config) {
        this.config = config;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const maxAttempts = this.config.maxReconnectAttempts ?? 10;
        const reconnectWait = this.config.reconnectTimeWait ?? 2000;
        while (this.reconnectAttempts < maxAttempts) {
            try {
                this.connection = await (0, nats_1.connect)({
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
            }
            catch (error) {
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
    async disconnect() {
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
    async publish(subject, data) {
        this.ensureConnection();
        const payload = this.jsonCodec.encode(data);
        this.connection.publish(subject, payload);
        this.logger.debug(`Published message to ${subject}`);
    }
    async publishProto(subject, data, messageType) {
        this.ensureConnection();
        const payload = messageType.encode(data).finish();
        this.connection.publish(subject, payload);
        this.logger.debug(`Published protobuf message to ${subject}`);
    }
    async publishString(subject, data) {
        this.ensureConnection();
        const payload = this.stringCodec.encode(data);
        this.connection.publish(subject, payload);
        this.logger.debug(`Published string message to ${subject}`);
    }
    async subscribe(subject, handler) {
        this.ensureConnection();
        const sub = this.connection.subscribe(subject, { queue: this.config.queue });
        this.subscriptions.push(sub);
        this.logger.log(`Subscribed to ${subject}${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`);
        (async () => {
            for await (const msg of sub) {
                try {
                    const data = this.jsonCodec.decode(msg.data);
                    await handler(data, msg.subject);
                }
                catch (error) {
                    this.logger.error(`Error processing message from ${msg.subject}: ${error}`);
                }
            }
        })();
        return sub;
    }
    async subscribeProto(subject, messageType, handler) {
        this.ensureConnection();
        const sub = this.connection.subscribe(subject, { queue: this.config.queue });
        this.subscriptions.push(sub);
        this.logger.log(`Subscribed to ${subject} (protobuf)${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`);
        (async () => {
            for await (const msg of sub) {
                try {
                    const data = messageType.decode(msg.data);
                    await handler(data, msg.subject);
                }
                catch (error) {
                    this.logger.error(`Error processing protobuf message from ${msg.subject}: ${error}`);
                }
            }
        })();
        return sub;
    }
    async subscribeString(subject, handler) {
        this.ensureConnection();
        const sub = this.connection.subscribe(subject, { queue: this.config.queue });
        this.subscriptions.push(sub);
        this.logger.log(`Subscribed to ${subject} (string)${this.config.queue ? ` (queue: ${this.config.queue})` : ''}`);
        (async () => {
            for await (const msg of sub) {
                try {
                    const data = this.stringCodec.decode(msg.data);
                    await handler(data, msg.subject);
                }
                catch (error) {
                    this.logger.error(`Error processing string message from ${msg.subject}: ${error}`);
                }
            }
        })();
        return sub;
    }
    async request(subject, data, timeout = 5000) {
        this.ensureConnection();
        const payload = this.jsonCodec.encode(data);
        const response = await this.connection.request(subject, payload, { timeout });
        return this.jsonCodec.decode(response.data);
    }
    getJetStream() {
        this.ensureConnection();
        if (!this.jetstream)
            throw new Error('JetStream client not initialized');
        return this.jetstream;
    }
    getJetStreamManager() {
        this.ensureConnection();
        if (!this.jetstreamManager)
            throw new Error('JetStream manager not initialized');
        return this.jetstreamManager;
    }
    isConnected() {
        return this.connection !== null && !this.connection.isClosed();
    }
    ensureConnection() {
        if (!this.connection || this.connection.isClosed()) {
            throw new Error('Not connected to NATS server');
        }
    }
    setupConnectionHandlers() {
        if (!this.connection)
            return;
        (async () => {
            for await (const status of this.connection.status()) {
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
            }
            else {
                this.logger.log('NATS connection closed');
            }
        });
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.NatsService = NatsService;
exports.NatsService = NatsService = NatsService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(nats_constants_js_1.NATS_OPTIONS)),
    tslib_1.__metadata("design:paramtypes", [Object])
], NatsService);
//# sourceMappingURL=nats.service.js.map