import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activite } from './entities/activite.entity';
import { ActiviteService } from './activite.service';
import { ActiviteController } from './activite.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activite])],
  controllers: [ActiviteController],
  providers: [ActiviteService],
  exports: [ActiviteService],
})
export class ActiviteModule {}
