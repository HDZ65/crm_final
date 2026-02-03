import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { MailboxModule } from '../mailbox/mailbox.module';
import { GoogleOAuthModule } from '../oauth/google/google-oauth.module';
import { MicrosoftOAuthModule } from '../oauth/microsoft/microsoft-oauth.module';

@Module({
  imports: [MailboxModule, GoogleOAuthModule, MicrosoftOAuthModule],
  controllers: [OperationsController],
})
export class OperationsModule {}
