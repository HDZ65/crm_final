import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembrePartenaireEntity } from './entities/membre-partenaire.entity';
import { MembrePartenaireService } from './membre-partenaire.service';

@Module({
  imports: [TypeOrmModule.forFeature([MembrePartenaireEntity])],
  providers: [MembrePartenaireService],
  exports: [MembrePartenaireService],
})
export class MembrePartenaireModule {}
