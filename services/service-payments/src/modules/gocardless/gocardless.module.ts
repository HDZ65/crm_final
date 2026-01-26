import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoCardlessAccountEntity } from './entities/gocardless-account.entity';
import { GoCardlessMandateEntity } from './entities/gocardless-mandate.entity';
import { GoCardlessService } from './gocardless.service';
import { RumGeneratorService } from './rum-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoCardlessAccountEntity, GoCardlessMandateEntity]),
  ],
  providers: [GoCardlessService, RumGeneratorService],
  exports: [GoCardlessService, RumGeneratorService],
})
export class GoCardlessModule {}
