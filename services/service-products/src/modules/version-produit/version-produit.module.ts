import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionProduitEntity } from './entities/version-produit.entity';
import { VersionProduitService } from './version-produit.service';

@Module({
  imports: [TypeOrmModule.forFeature([VersionProduitEntity])],
  providers: [VersionProduitService],
  exports: [VersionProduitService],
})
export class VersionProduitModule {}
