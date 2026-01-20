import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoCardlessAccountEntity } from './entities/gocardless-account.entity.js';
import { GoCardlessMandateEntity } from './entities/gocardless-mandate.entity.js';
import { GoCardlessService } from './gocardless.service.js';
import { RumGeneratorService } from './rum-generator.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoCardlessAccountEntity, GoCardlessMandateEntity]),
  ],
  providers: [GoCardlessService, RumGeneratorService],
  exports: [GoCardlessService, RumGeneratorService],
})
export class GoCardlessModule {}
