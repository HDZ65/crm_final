import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoiteMail } from './entities/boite-mail.entity';
import { BoiteMailService } from './boite-mail.service';
import { BoiteMailController } from './boite-mail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BoiteMail])],
  controllers: [BoiteMailController],
  providers: [BoiteMailService],
  exports: [BoiteMailService],
})
export class BoiteMailModule {}
