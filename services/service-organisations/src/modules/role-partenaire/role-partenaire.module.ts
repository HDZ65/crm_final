import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePartenaireEntity } from './entities/role-partenaire.entity';
import { RolePartenaireService } from './role-partenaire.service';

@Module({
  imports: [TypeOrmModule.forFeature([RolePartenaireEntity])],
  providers: [RolePartenaireService],
  exports: [RolePartenaireService],
})
export class RolePartenaireModule {}
