import { Module } from '@nestjs/common';
import { KeycloakJwtGuard } from './keycloak-jwt.guard';

@Module({
  providers: [KeycloakJwtGuard],
  exports: [KeycloakJwtGuard],
})
export class AuthModule {}
