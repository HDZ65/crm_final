export interface ProtoPathOptions {
    protoFile: string;
    includeDirs?: string[];
}
export declare function isDocker(): boolean;
export declare function isProduction(): boolean;
export declare function getProtoBaseDir(): string;
export declare function resolveProtoPath(protoFile: string): string;
export declare function resolveProtoPaths(protoFiles: string[]): string[];
export declare function getProtoIncludeDirs(): string[];
export declare function getProtoLoaderConfig(protoFile: string): {
    protoPath: string;
    includeDirs: string[];
};
export declare function getGrpcOptions(serviceName: string, options?: {
    url?: string;
    maxMessageSize?: number;
}): {
    package: string;
    protoPath: string;
    url: string;
    loader: {
        keepCase: boolean;
        longs: StringConstructor;
        enums: StringConstructor;
        defaults: boolean;
        oneofs: boolean;
        includeDirs: string[];
    };
    maxReceiveMessageLength?: number;
    maxSendMessageLength?: number;
};
export declare function getMultiGrpcOptions(serviceNames: string[], options?: {
    url?: string;
    maxMessageSize?: number;
}): {
    package: string[];
    protoPath: string[];
    url: string;
    loader: {
        keepCase: boolean;
        longs: StringConstructor;
        enums: StringConstructor;
        defaults: boolean;
        oneofs: boolean;
        includeDirs: string[];
    };
    maxReceiveMessageLength?: number;
    maxSendMessageLength?: number;
};
//# sourceMappingURL=proto-loader.d.ts.map