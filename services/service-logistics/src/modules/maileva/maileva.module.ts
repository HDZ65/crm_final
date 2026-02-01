import { Module } from '@nestjs/common';
import { MailevaService } from './maileva.service.js';
import { MailevaController } from './maileva.controller.js';

@Module({
  controllers: [MailevaController],
  providers: [MailevaService],
  exports: [MailevaService],
})
export class MailevaModule {}
