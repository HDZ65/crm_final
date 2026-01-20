import { Module } from '@nestjs/common';
import { MailevaService } from './maileva.service.js';

@Module({
  providers: [MailevaService],
  exports: [MailevaService],
})
export class MailevaModule {}
