import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryPolicyEntity } from './entities/retry-policy.entity';
import { RetryPolicyService } from './retry-policy.service';
import { RetryPolicyController } from './retry-policy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RetryPolicyEntity])],
  controllers: [RetryPolicyController],
  providers: [RetryPolicyService],
  exports: [RetryPolicyService],
})
export class RetryPolicyModule {}
