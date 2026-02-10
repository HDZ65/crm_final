"use strict";
var NatsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const nats_service_js_1 = require("./nats.service.js");
const nats_constants_js_1 = require("./nats.constants.js");
let NatsModule = NatsModule_1 = class NatsModule {
    static forRoot(options) {
        return {
            module: NatsModule_1,
            providers: [
                {
                    provide: nats_constants_js_1.NATS_OPTIONS,
                    useValue: options,
                },
                nats_service_js_1.NatsService,
            ],
            exports: [nats_service_js_1.NatsService],
        };
    }
    static forRootAsync(options) {
        return {
            module: NatsModule_1,
            imports: options.imports || [],
            providers: [
                {
                    provide: nats_constants_js_1.NATS_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                nats_service_js_1.NatsService,
            ],
            exports: [nats_service_js_1.NatsService],
        };
    }
};
exports.NatsModule = NatsModule;
exports.NatsModule = NatsModule = NatsModule_1 = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], NatsModule);
//# sourceMappingURL=nats.module.js.map