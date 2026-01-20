import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryPolicyEntity } from './entities/retry-policy.entity';
import { RetryPolicyService } from './retry-policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([RetryPolicyEntity])],
  providers: [RetryPolicyService],
  exports: [RetryPolicyService],
})
export class RetryPolicyModule {}
