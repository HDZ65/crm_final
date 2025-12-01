import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Configuration de la connexion à la base de données PostgreSQL
 * Utilise les variables d'environnement ou des valeurs par défaut
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  autoLoadEntities: true,
  synchronize: process.env.DB_SYNCHRONIZE
    ? process.env.DB_SYNCHRONIZE === 'true'
    : true,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

/**
 * Retourne la configuration de la base de données
 * Utile pour les migrations ou l'utilisation en dehors de NestJS
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  return databaseConfig;
}

/**
 * Affiche les informations de connexion (sans le mot de passe)
 */
export function getDatabaseConnectionInfo(): string {
  const config = databaseConfig as any;
  return `
╔═══════════════════════════════════════════════╗
║        Configuration Base de Données         ║
╠═══════════════════════════════════════════════╣
║ Type:          ${config.type?.toString().padEnd(30)} ║
║ Hôte:          ${config.host?.toString().padEnd(30)} ║
║ Port:          ${config.port?.toString().padEnd(30)} ║
║ Base:          ${config.database?.toString().padEnd(30)} ║
║ Utilisateur:   ${config.username?.toString().padEnd(30)} ║
║ Synchronize:   ${config.synchronize?.toString().padEnd(30)} ║
║ Logging:       ${config.logging?.toString().padEnd(30)} ║
╚═══════════════════════════════════════════════╝
  `.trim();
}
