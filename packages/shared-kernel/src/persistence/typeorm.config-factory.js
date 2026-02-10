"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmConfigFactory = void 0;
class TypeOrmConfigFactory {
    static createNestConfig(config, migrations = ['dist/**/migrations/*.js'], overrides = {}) {
        return {
            type: 'postgres',
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            migrations,
            synchronize: false,
            logging: config.logging ?? false,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            autoLoadEntities: true,
            ...overrides,
        };
    }
    static createDataSourceConfig(config, entities, migrations) {
        return {
            type: 'postgres',
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            entities,
            migrations,
            synchronize: false,
        };
    }
    static fromEnv(prefix = 'DB') {
        return {
            host: process.env[`${prefix}_HOST`] || 'localhost',
            port: parseInt(process.env[`${prefix}_PORT`] || '5432', 10),
            username: process.env[`${prefix}_USERNAME`] || 'crm',
            password: process.env[`${prefix}_PASSWORD`] || 'crm',
            database: process.env[`${prefix}_DATABASE`] || 'crm_db',
            ssl: process.env[`${prefix}_SSL`] === 'true',
            logging: process.env[`${prefix}_LOGGING`] === 'true',
        };
    }
    static fromConfigService(configService, prefix = 'DB') {
        return {
            host: configService.get(`${prefix}_HOST`, 'localhost'),
            port: parseInt(configService.get(`${prefix}_PORT`, '5432'), 10),
            username: configService.get(`${prefix}_USERNAME`, 'crm'),
            password: configService.get(`${prefix}_PASSWORD`, 'crm'),
            database: configService.get(`${prefix}_DATABASE`, 'crm_db'),
            ssl: configService.get(`${prefix}_SSL`, 'false') === 'true',
            logging: configService.get(`${prefix}_LOGGING`, 'false') === 'true',
        };
    }
}
exports.TypeOrmConfigFactory = TypeOrmConfigFactory;
//# sourceMappingURL=typeorm.config-factory.js.map