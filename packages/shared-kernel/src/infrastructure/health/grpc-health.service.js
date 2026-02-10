"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = exports.ServingStatus = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
var ServingStatus;
(function (ServingStatus) {
    ServingStatus[ServingStatus["UNKNOWN"] = 0] = "UNKNOWN";
    ServingStatus[ServingStatus["SERVING"] = 1] = "SERVING";
    ServingStatus[ServingStatus["NOT_SERVING"] = 2] = "NOT_SERVING";
    ServingStatus[ServingStatus["SERVICE_UNKNOWN"] = 3] = "SERVICE_UNKNOWN";
})(ServingStatus || (exports.ServingStatus = ServingStatus = {}));
let HealthService = class HealthService {
    statusSubject = new rxjs_1.Subject();
    serviceStatus = new Map();
    constructor() {
        this.serviceStatus.set('', ServingStatus.SERVING);
    }
    check(request) {
        const serviceName = request.service || '';
        const status = this.serviceStatus.get(serviceName) ?? ServingStatus.SERVICE_UNKNOWN;
        return { status };
    }
    watch(request) {
        const serviceName = request.service || '';
        const status = this.serviceStatus.get(serviceName) ?? ServingStatus.SERVICE_UNKNOWN;
        this.statusSubject.next({ status });
        return this.statusSubject.asObservable();
    }
    setServiceStatus(serviceName, status) {
        this.serviceStatus.set(serviceName, status);
        this.statusSubject.next({ status });
    }
    getServiceStatus(serviceName) {
        return this.serviceStatus.get(serviceName) ?? ServingStatus.SERVICE_UNKNOWN;
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], HealthService);
//# sourceMappingURL=grpc-health.service.js.map