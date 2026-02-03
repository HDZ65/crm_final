import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailboxEntity } from './entities/mailbox.entity';
import { MailboxService } from './mailbox.service';
import { MailboxController } from './mailbox.controller';
import { EncryptionService } from '../../../common/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([MailboxEntity])],
  controllers: [MailboxController],
  providers: [MailboxService, EncryptionService],
  exports: [MailboxService],
})
export class MailboxModule {}
