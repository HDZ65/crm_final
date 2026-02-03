import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePartenaireEntity } from './entities/role-partenaire.entity';
import { RolePartenaireService } from './role-partenaire.service';
import { RolePartenaireController } from './role-partenaire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolePartenaireEntity])],
  controllers: [RolePartenaireController],
  providers: [RolePartenaireService],
  exports: [RolePartenaireService],
})
export class RolePartenaireModule {}
