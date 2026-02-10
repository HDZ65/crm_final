import { DynamicModule } from '@nestjs/common';
import type { NatsConfig } from './nats.service.js';
export interface NatsModuleOptions extends NatsConfig {
}
export declare class NatsModule {
    static forRoot(options: NatsModuleOptions): DynamicModule;
    static forRootAsync(options: {
        imports?: any[];
        useFactory: (...args: any[]) => Promise<NatsModuleOptions> | NatsModuleOptions;
        inject?: any[];
    }): DynamicModule;
}
//# sourceMappingURL=nats.module.d.ts.map