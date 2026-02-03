import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembrePartenaireEntity } from './entities/membre-partenaire.entity';
import { MembrePartenaireService } from './membre-partenaire.service';
import { MembrePartenaireController } from './membre-partenaire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MembrePartenaireEntity])],
  controllers: [MembrePartenaireController],
  providers: [MembrePartenaireService],
  exports: [MembrePartenaireService],
})
export class MembrePartenaireModule {}
