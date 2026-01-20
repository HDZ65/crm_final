import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LegalMentionsService } from './services/legal-mentions.service';

@Module({
  imports: [ConfigModule],
  providers: [LegalMentionsService],
  exports: [LegalMentionsService],
})
export class ComplianceModule {}
