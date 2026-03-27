import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CfastConfigService } from '../../persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastConfigEntity } from '../../../domain/cfast/entities/cfast-config.entity';
import { EncryptionService } from '../../security/encryption.service';

// Helper: read proto fields in both camelCase and snake_case (keepCase:true sends snake_case)
function f(data: Record<string, any>, camel: string, snake: string): any {
  return data[camel] ?? data[snake];
}

@Controller()
export class CfastConfigController {
  private readonly logger = new Logger(CfastConfigController.name);

  constructor(
    private readonly configService: CfastConfigService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // Helper: entity → proto response (snake_case for keepCase:true)
  private toProto(entity: CfastConfigEntity) {
    return {
      id: entity.id,
      organisation_id: entity.organisationId,
      base_url: entity.baseUrl,
      client_id_encrypted: entity.clientIdEncrypted,
      client_secret_encrypted: entity.clientSecretEncrypted,
      username_encrypted: entity.usernameEncrypted,
      password_encrypted: entity.passwordEncrypted,
      scopes: entity.scopes,
      active: entity.active,
      last_sync_at: entity.lastSyncAt?.toISOString() ?? '',
      sync_error: entity.syncError ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('CfastConfigService', 'Get')
  async get(data: Record<string, any>) {
    const entity = await this.configService.findById(data.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `CFAST config not found: ${data.id}`,
      });
    }
    return this.toProto(entity);
  }

  @GrpcMethod('CfastConfigService', 'GetByOrganisation')
  async getByOrganisation(data: Record<string, any>) {
    const organisationId = f(data, 'organisationId', 'organisation_id');
    const entity = await this.configService.findByOrganisationId(organisationId);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `CFAST config not found for organisation ${organisationId}`,
      });
    }
    return this.toProto(entity);
  }

  @GrpcMethod('CfastConfigService', 'Create')
  async create(data: Record<string, any>) {
    const entity = new CfastConfigEntity();
    entity.organisationId = f(data, 'organisationId', 'organisation_id');
    entity.baseUrl = f(data, 'baseUrl', 'base_url');
    // Proto field names say "encrypted" but frontend sends PLAINTEXT — encrypt before saving
    const clientId = f(data, 'clientIdEncrypted', 'client_id_encrypted');
    const clientSecret = f(data, 'clientSecretEncrypted', 'client_secret_encrypted');
    const username = f(data, 'usernameEncrypted', 'username_encrypted');
    const password = f(data, 'passwordEncrypted', 'password_encrypted');
    entity.clientIdEncrypted = this.encryptionService.encrypt(clientId);
    entity.clientSecretEncrypted = this.encryptionService.encrypt(clientSecret);
    entity.usernameEncrypted = this.encryptionService.encrypt(username);
    entity.passwordEncrypted = this.encryptionService.encrypt(password);
    entity.scopes = f(data, 'scopes', 'scopes') || 'openid identity bill';
    entity.active = false;
    const saved = await this.configService.save(entity);
    return this.toProto(saved);
  }

  @GrpcMethod('CfastConfigService', 'Update')
  async update(data: Record<string, any>) {
    const entity = await this.configService.findById(data.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `CFAST config not found: ${data.id}`,
      });
    }
    const baseUrl = f(data, 'baseUrl', 'base_url');
    const clientId = f(data, 'clientIdEncrypted', 'client_id_encrypted');
    const clientSecret = f(data, 'clientSecretEncrypted', 'client_secret_encrypted');
    const username = f(data, 'usernameEncrypted', 'username_encrypted');
    const password = f(data, 'passwordEncrypted', 'password_encrypted');
    const scopes = f(data, 'scopes', 'scopes');
    if (baseUrl) entity.baseUrl = baseUrl;
    if (clientId) entity.clientIdEncrypted = this.encryptionService.encrypt(clientId);
    if (clientSecret) entity.clientSecretEncrypted = this.encryptionService.encrypt(clientSecret);
    if (username) entity.usernameEncrypted = this.encryptionService.encrypt(username);
    if (password) entity.passwordEncrypted = this.encryptionService.encrypt(password);
    if (scopes) entity.scopes = scopes;
    if (data.active !== undefined) entity.active = data.active;
    const saved = await this.configService.save(entity);
    return this.toProto(saved);
  }

  @GrpcMethod('CfastConfigService', 'Delete')
  async delete(data: Record<string, any>) {
    await this.configService.delete(data.id);
    return { success: true };
  }

  @GrpcMethod('CfastConfigService', 'TestConnection')
  async testConnection(data: Record<string, any>) {
    const organisationId = f(data, 'organisationId', 'organisation_id');
    const entity = await this.configService.findByOrganisationId(organisationId);
    if (!entity) {
      return {
        success: false,
        message: 'Configuration not found',
        api_version: '',
      };
    }

    try {
      // Decrypt credentials for OAuth2 token exchange
      const clientId = this.encryptionService.decrypt(entity.clientIdEncrypted);
      const clientSecret = this.encryptionService.decrypt(entity.clientSecretEncrypted);
      const username = this.encryptionService.decrypt(entity.usernameEncrypted);
      const password = this.encryptionService.decrypt(entity.passwordEncrypted);
      const scopes = entity.scopes || 'openid identity bill';

      // Attempt OAuth2 ROPC token exchange
      const tokenUrl = 'https://v2.cfast.fr/auth/connect/token';
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
        scope: scopes,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful — OAuth2 token obtained',
          api_version: 'v2',
        };
      }

      const errorBody = await response.text();
      this.logger.warn(`CFAST TestConnection failed: ${response.status} — ${errorBody}`);
      return {
        success: false,
        message: `Authentication failed (HTTP ${response.status}): ${errorBody}`,
        api_version: '',
      };
    } catch (error: any) {
      this.logger.error(`CFAST TestConnection error: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Connection error: ${error.message}`,
        api_version: '',
      };
    }
  }
}
