import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeActivite } from './entities/type-activite.entity';
import { TypeActiviteService } from './type-activite.service';

@Module({
  imports: [TypeOrmModule.forFeature([TypeActivite])],
  providers: [TypeActiviteService],
  exports: [TypeActiviteService],
})
export class TypeActiviteModule {}
