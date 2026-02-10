"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGrpcPackage = loadGrpcPackage;
exports.getGrpcClientModuleOptions = getGrpcClientModuleOptions;
const grpc_js_1 = require("@grpc/grpc-js");
const proto_loader_1 = require("@grpc/proto-loader");
const proto_loader_js_1 = require("./proto-loader.js");
const service_config_js_1 = require("./service-config.js");
function loadGrpcPackage(serviceName, options) {
    const serviceConfig = (0, service_config_js_1.getServiceConfig)(serviceName);
    const protoConfig = (0, proto_loader_js_1.getProtoLoaderConfig)(serviceConfig.protoFile);
    const packageDef = (0, proto_loader_1.loadSync)(protoConfig.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: protoConfig.includeDirs,
        ...options?.loaderOptions,
    });
    return (0, grpc_js_1.loadPackageDefinition)(packageDef);
}
function getGrpcClientModuleOptions(clientName, serviceName, options) {
    const serviceConfig = (0, service_config_js_1.getServiceConfig)(serviceName);
    const protoConfig = (0, proto_loader_js_1.getProtoLoaderConfig)(serviceConfig.protoFile);
    const url = options?.url || (0, service_config_js_1.getServiceUrl)(serviceName);
    return {
        name: clientName,
        transport: 4,
        options: {
            package: serviceConfig.package,
            protoPath: protoConfig.protoPath,
            url,
            loader: {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: protoConfig.includeDirs,
            },
        },
    };
}
//# sourceMappingURL=grpc-client.js.map