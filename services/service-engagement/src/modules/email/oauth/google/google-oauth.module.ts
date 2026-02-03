import { Module, forwardRef } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOAuthController } from './google-oauth.controller';
import { MailboxModule } from '../../mailbox/mailbox.module';

@Module({
  imports: [forwardRef(() => MailboxModule)],
  controllers: [GoogleOAuthController],
  providers: [GoogleOAuthService],
  exports: [GoogleOAuthService],
})
export class GoogleOAuthModule {}
