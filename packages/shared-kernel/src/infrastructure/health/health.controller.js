"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const grpc_health_service_js_1 = require("./grpc-health.service.js");
let HealthController = class HealthController {
    healthService;
    constructor(healthService) {
        this.healthService = healthService;
    }
    check(request) {
        return this.healthService.check(request);
    }
    watch(request) {
        return this.healthService.watch(request);
    }
};
exports.HealthController = HealthController;
tslib_1.__decorate([
    (0, microservices_1.GrpcMethod)('Health', 'Check'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Object)
], HealthController.prototype, "check", null);
tslib_1.__decorate([
    (0, microservices_1.GrpcMethod)('Health', 'Watch'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], HealthController.prototype, "watch", null);
exports.HealthController = HealthController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [grpc_health_service_js_1.HealthService])
], HealthController);
//# sourceMappingURL=health.controller.js.map