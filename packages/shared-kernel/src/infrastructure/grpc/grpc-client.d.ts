import { Options as ProtoLoaderOptions } from '@grpc/proto-loader';
import type { ServiceName } from './service-config.js';
export interface GrpcClientOptions {
    url?: string;
    loaderOptions?: Partial<ProtoLoaderOptions>;
}
export declare function loadGrpcPackage(serviceName: ServiceName, options?: Pick<GrpcClientOptions, 'loaderOptions'>): any;
export declare function getGrpcClientModuleOptions(clientName: string, serviceName: ServiceName, options?: {
    url?: string;
}): {
    name: string;
    transport: number;
    options: {
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
    };
};
//# sourceMappingURL=grpc-client.d.ts.map