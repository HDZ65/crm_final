import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientPartenaireEntity } from './entities/client-partenaire.entity';
import { ClientPartenaireService } from './client-partenaire.service';
import { ClientPartenaireController } from './client-partenaire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientPartenaireEntity])],
  controllers: [ClientPartenaireController],
  providers: [ClientPartenaireService],
  exports: [ClientPartenaireService],
})
export class ClientPartenaireModule {}
