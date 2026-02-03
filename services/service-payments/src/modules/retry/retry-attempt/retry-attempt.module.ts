import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryAttemptEntity } from './entities/retry-attempt.entity';
import { RetryAttemptService } from './retry-attempt.service';

@Module({
  imports: [TypeOrmModule.forFeature([RetryAttemptEntity])],
  providers: [RetryAttemptService],
  exports: [RetryAttemptService],
})
export class RetryAttemptModule {}
