import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RetryClientService } from './retry-client.service';

@Module({
  imports: [ConfigModule],
  providers: [RetryClientService],
  exports: [RetryClientService],
})
export class RetryModule {}
