export interface ServiceConfig {
    package: string;
    protoFile: string;
    defaultPort: number;
    serviceName: string;
}
export declare const SERVICE_REGISTRY: Record<string, ServiceConfig>;
export type ServiceName = keyof typeof SERVICE_REGISTRY;
export declare function getServiceConfig(serviceName: ServiceName): ServiceConfig;
export declare function getServiceUrl(serviceName: ServiceName, host?: string): string;
//# sourceMappingURL=service-config.d.ts.map