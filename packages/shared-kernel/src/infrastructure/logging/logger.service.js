"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLoggerService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
let AppLoggerService = class AppLoggerService {
    context;
    requestId;
    setContext(context) {
        this.context = context;
    }
    setRequestId(requestId) {
        this.requestId = requestId;
    }
    log(message, context) {
        this.print('info', message, context);
    }
    error(message, trace, context) {
        this.print('error', message, { ...context, trace });
    }
    warn(message, context) {
        this.print('warn', message, context);
    }
    debug(message, context) {
        this.print('debug', message, context);
    }
    verbose(message, context) {
        this.print('verbose', message, context);
    }
    print(level, message, context) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            context: this.context,
            requestId: this.requestId,
            ...context,
        };
        const output = JSON.stringify(logEntry);
        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'debug':
            case 'verbose':
                if (process.env.NODE_ENV !== 'production') {
                    console.log(output);
                }
                break;
            default:
                console.log(output);
        }
    }
};
exports.AppLoggerService = AppLoggerService;
exports.AppLoggerService = AppLoggerService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], AppLoggerService);
//# sourceMappingURL=logger.service.js.map