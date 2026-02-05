import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeActivite } from './entities/type-activite.entity';
import { TypeActiviteService } from './type-activite.service';
import { TypeActiviteController } from './type-activite.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TypeActivite])],
  controllers: [TypeActiviteController],
  providers: [TypeActiviteService],
  exports: [TypeActiviteService],
})
export class TypeActiviteModule {}
