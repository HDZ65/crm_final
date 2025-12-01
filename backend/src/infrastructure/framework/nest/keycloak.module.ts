// src/framework/nest/http/keycloak.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  KeycloakConnectModule,
  PolicyEnforcementMode,
  TokenValidation,
  KeycloakConnectOptions,
} from 'nest-keycloak-connect';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): KeycloakConnectOptions => {
        const requireEnv = (k: string) => {
          const v = cfg.get<string>(k);
          if (!v) throw new Error(`Missing env ${k}`);
          return v;
        };
        const optionalEnv = (k: string) => {
          const value = cfg.get<string>(k);
          return value && value.trim().length > 0 ? value : undefined;
        };

        const maybeSecret = optionalEnv('KC_SECRET');
        const keycloakConfig = {
          authServerUrl: requireEnv('KC_URL'), // e.g. http://localhost:8080
          realm: requireEnv('KC_REALM'), // demo
          clientId: requireEnv('KC_CLIENT_ID'), // nest-api-local
          policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
          tokenValidation: TokenValidation.ONLINE,
        } as KeycloakConnectOptions & { secret?: string; public?: boolean };

        if (maybeSecret) {
          keycloakConfig.secret = maybeSecret; // confidential client
        } else {
          keycloakConfig.public = true; // allow public client (no secret)
        }

        return keycloakConfig;
      },
    }),
  ],
  exports: [KeycloakConnectModule],
})
export class KeycloakModule {}
