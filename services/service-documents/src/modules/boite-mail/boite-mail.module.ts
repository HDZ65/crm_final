import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoiteMail } from './entities/boite-mail.entity';
import { BoiteMailService } from './boite-mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([BoiteMail])],
  providers: [BoiteMailService],
  exports: [BoiteMailService],
})
export class BoiteMailModule {}
