import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionProduitEntity } from './entities/version-produit.entity';
import { VersionProduitService } from './version-produit.service';
import { VersionProduitController } from './version-produit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VersionProduitEntity])],
  controllers: [VersionProduitController],
  providers: [VersionProduitService],
  exports: [VersionProduitService],
})
export class VersionProduitModule {}
