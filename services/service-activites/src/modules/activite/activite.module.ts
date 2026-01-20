import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activite } from './entities/activite.entity';
import { ActiviteService } from './activite.service';

@Module({
  imports: [TypeOrmModule.forFeature([Activite])],
  providers: [ActiviteService],
  exports: [ActiviteService],
})
export class ActiviteModule {}
