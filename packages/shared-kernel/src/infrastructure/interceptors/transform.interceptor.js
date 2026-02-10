"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformInterceptor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const class_transformer_1 = require("class-transformer");
let TransformInterceptor = class TransformInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => {
            const transformed = (0, class_transformer_1.instanceToPlain)(data);
            if (context.getType() === 'http') {
                return {
                    data: transformed,
                };
            }
            return transformed;
        }));
    }
};
exports.TransformInterceptor = TransformInterceptor;
exports.TransformInterceptor = TransformInterceptor = tslib_1.__decorate([
    (0, common_1.Injectable)()
], TransformInterceptor);
//# sourceMappingURL=transform.interceptor.js.map