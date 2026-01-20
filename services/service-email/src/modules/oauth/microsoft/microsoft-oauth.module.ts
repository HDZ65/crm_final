import { Module } from '@nestjs/common';
import { MicrosoftOAuthService } from './microsoft-oauth.service';

@Module({
  providers: [MicrosoftOAuthService],
  exports: [MicrosoftOAuthService],
})
export class MicrosoftOAuthModule {}
