import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Service pour gérer la connexion à la base de données
 * Fournit des méthodes pour tester et gérer la connexion
 */
@Injectable()
export class DatabaseService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Vérifie si la connexion à la base de données est active
   */
  async isConnected(): Promise<boolean> {
    try {
      return this.dataSource.isInitialized;
    } catch (error) {
      return false;
    }
  }

  /**
   * Teste la connexion en exécutant une requête simple
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        success: true,
        message: 'Connexion à la base de données réussie',
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur de connexion: ${error.message}`,
      };
    }
  }

  /**
   * Récupère les informations sur la connexion
   */
  getConnectionInfo() {
    return {
      isConnected: this.dataSource.isInitialized,
      database: this.dataSource.options.database,
      type: this.dataSource.options.type,
      host: (this.dataSource.options as any).host,
      port: (this.dataSource.options as any).port,
    };
  }

  /**
   * Exécute une requête brute (à utiliser avec précaution)
   */
  async executeQuery(query: string): Promise<any> {
    return this.dataSource.query(query);
  }

  /**
   * Récupère le DataSource TypeORM pour des opérations avancées
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
