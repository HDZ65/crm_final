import { DynamicModule, Global, Module } from '@nestjs/common';
import { NatsService } from './nats.service.js';
import type { NatsConfig } from './nats.service.js';
import { NATS_OPTIONS } from './nats.constants.js';

export interface NatsModuleOptions extends NatsConfig {}

@Global()
@Module({})
export class NatsModule {
  static forRoot(options: NatsModuleOptions): DynamicModule {
    return {
      module: NatsModule,
      providers: [
        {
          provide: NATS_OPTIONS,
          useValue: options,
        },
        NatsService,
      ],
      exports: [NatsService],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<NatsModuleOptions> | NatsModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: NatsModule,
      imports: options.imports || [],
      providers: [
        {
          provide: NATS_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        NatsService,
      ],
      exports: [NatsService],
    };
  }
}
