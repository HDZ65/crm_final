import { Module, forwardRef } from '@nestjs/common';
import { MicrosoftOAuthService } from './microsoft-oauth.service';
import { MicrosoftOAuthController } from './microsoft-oauth.controller';
import { MailboxModule } from '../../mailbox/mailbox.module';

@Module({
  imports: [forwardRef(() => MailboxModule)],
  controllers: [MicrosoftOAuthController],
  providers: [MicrosoftOAuthService],
  exports: [MicrosoftOAuthService],
})
export class MicrosoftOAuthModule {}
