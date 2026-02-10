"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDocker = isDocker;
exports.isProduction = isProduction;
exports.getProtoBaseDir = getProtoBaseDir;
exports.resolveProtoPath = resolveProtoPath;
exports.resolveProtoPaths = resolveProtoPaths;
exports.getProtoIncludeDirs = getProtoIncludeDirs;
exports.getProtoLoaderConfig = getProtoLoaderConfig;
exports.getGrpcOptions = getGrpcOptions;
exports.getMultiGrpcOptions = getMultiGrpcOptions;
const fs_1 = require("fs");
const path_1 = require("path");
const service_config_js_1 = require("./service-config.js");
function resolvePackagePath(packageName) {
    try {
        return require.resolve(packageName);
    }
    catch {
        return null;
    }
}
function isDocker() {
    return (0, fs_1.existsSync)('/.dockerenv') || process.env.DOCKER === 'true';
}
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
function getProtoBaseDir() {
    if (isDocker() || isProduction()) {
        const dockerPath = '/app/proto';
        if ((0, fs_1.existsSync)(dockerPath)) {
            return dockerPath;
        }
    }
    try {
        const protoPackagePath = resolvePackagePath('@crm/proto/package.json');
        const protoSrcDir = (0, path_1.join)((0, path_1.dirname)(protoPackagePath), 'src');
        if ((0, fs_1.existsSync)(protoSrcDir)) {
            return protoSrcDir;
        }
    }
    catch {
    }
    const fallbackPaths = [
        (0, path_1.join)(process.cwd(), 'packages/proto/src'),
        (0, path_1.join)(process.cwd(), '../packages/proto/src'),
        (0, path_1.join)(process.cwd(), '../../packages/proto/src'),
    ];
    for (const fallback of fallbackPaths) {
        if ((0, fs_1.existsSync)(fallback)) {
            return fallback;
        }
    }
    throw new Error('Could not find proto source directory. ' +
        'Ensure @crm/proto is installed or proto files exist in packages/proto/src/');
}
function resolveProtoPath(protoFile) {
    const baseDir = getProtoBaseDir();
    const fullPath = (0, path_1.join)(baseDir, protoFile);
    if (!(0, fs_1.existsSync)(fullPath)) {
        throw new Error(`Proto file not found: ${fullPath}\n` +
            `Base directory: ${baseDir}\n` +
            `Proto file: ${protoFile}`);
    }
    return fullPath;
}
function resolveProtoPaths(protoFiles) {
    return protoFiles.map(resolveProtoPath);
}
function getProtoIncludeDirs() {
    const baseDir = getProtoBaseDir();
    return [baseDir, (0, path_1.dirname)(baseDir)];
}
function getProtoLoaderConfig(protoFile) {
    return {
        protoPath: resolveProtoPath(protoFile),
        includeDirs: getProtoIncludeDirs(),
    };
}
function getGrpcOptions(serviceName, options) {
    const config = (0, service_config_js_1.getServiceConfig)(serviceName);
    const protoConfig = getProtoLoaderConfig(config.protoFile);
    const url = options?.url || (0, service_config_js_1.getServiceUrl)(serviceName);
    const maxSize = options?.maxMessageSize || 20 * 1024 * 1024;
    return {
        package: config.package,
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
        maxReceiveMessageLength: maxSize,
        maxSendMessageLength: maxSize,
    };
}
function getMultiGrpcOptions(serviceNames, options) {
    const packages = [];
    const protoPaths = [];
    for (const name of serviceNames) {
        const config = (0, service_config_js_1.getServiceConfig)(name);
        packages.push(config.package);
        protoPaths.push(resolveProtoPath(config.protoFile));
    }
    const url = options?.url || (0, service_config_js_1.getServiceUrl)(serviceNames[0]);
    const maxSize = options?.maxMessageSize || 20 * 1024 * 1024;
    return {
        package: packages,
        protoPath: protoPaths,
        url,
        loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            includeDirs: getProtoIncludeDirs(),
        },
        maxReceiveMessageLength: maxSize,
        maxSendMessageLength: maxSize,
    };
}
//# sourceMappingURL=proto-loader.js.map