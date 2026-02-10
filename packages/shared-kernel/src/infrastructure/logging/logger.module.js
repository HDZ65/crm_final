"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const logger_service_js_1 = require("./logger.service.js");
let LoggerModule = class LoggerModule {
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [logger_service_js_1.AppLoggerService],
        exports: [logger_service_js_1.AppLoggerService],
    })
], LoggerModule);
//# sourceMappingURL=logger.module.js.map