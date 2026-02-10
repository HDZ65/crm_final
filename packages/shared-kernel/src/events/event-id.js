"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deterministicEventId = deterministicEventId;
const uuid_1 = require("uuid");
const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
function deterministicEventId(subject, requestId) {
    const name = `crm.events|${subject}|${requestId}`;
    return (0, uuid_1.v5)(name, DNS_NAMESPACE);
}
//# sourceMappingURL=event-id.js.map