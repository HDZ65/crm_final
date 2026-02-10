"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const cqrs_1 = require("@nestjs/cqrs");
class AggregateRoot extends cqrs_1.AggregateRoot {
    version = 0;
    incrementVersion() {
        this.version++;
    }
    getVersion() {
        return this.version;
    }
    markEventsAsCommitted() {
        this.commit();
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.base.js.map