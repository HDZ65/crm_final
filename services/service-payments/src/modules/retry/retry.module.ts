import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RetryClientService } from './retry-client.service.js';

@Module({
  imports: [ConfigModule],
  providers: [RetryClientService],
  exports: [RetryClientService],
})
export class RetryModule {}
