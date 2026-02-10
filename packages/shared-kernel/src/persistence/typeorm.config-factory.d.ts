import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
    logging?: boolean;
}
export declare class TypeOrmConfigFactory {
    static createNestConfig(config: DatabaseConfig, migrations?: string[], overrides?: Partial<TypeOrmModuleOptions>): TypeOrmModuleOptions;
    static createDataSourceConfig(config: DatabaseConfig, entities: string[], migrations: string[]): DataSourceOptions;
    static fromEnv(prefix?: string): DatabaseConfig;
    static fromConfigService(configService: {
        get: (key: string, defaultValue?: string) => string;
    }, prefix?: string): DatabaseConfig;
}
//# sourceMappingURL=typeorm.config-factory.d.ts.map