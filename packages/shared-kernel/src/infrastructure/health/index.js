"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = exports.ServingStatus = exports.HealthService = void 0;
var grpc_health_service_js_1 = require("./grpc-health.service.js");
Object.defineProperty(exports, "HealthService", { enumerable: true, get: function () { return grpc_health_service_js_1.HealthService; } });
Object.defineProperty(exports, "ServingStatus", { enumerable: true, get: function () { return grpc_health_service_js_1.ServingStatus; } });
var health_controller_js_1 = require("./health.controller.js");
Object.defineProperty(exports, "HealthController", { enumerable: true, get: function () { return health_controller_js_1.HealthController; } });
//# sourceMappingURL=index.js.map