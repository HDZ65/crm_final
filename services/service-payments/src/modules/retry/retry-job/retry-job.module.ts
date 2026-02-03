import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryJobEntity } from './entities/retry-job.entity';
import { RetryJobService } from './retry-job.service';

@Module({
  imports: [TypeOrmModule.forFeature([RetryJobEntity])],
  providers: [RetryJobService],
  exports: [RetryJobService],
})
export class RetryJobModule {}
