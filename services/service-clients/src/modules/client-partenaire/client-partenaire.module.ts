import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientPartenaireEntity } from './entities/client-partenaire.entity';
import { ClientPartenaireService } from './client-partenaire.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientPartenaireEntity])],
  providers: [ClientPartenaireService],
  exports: [ClientPartenaireService],
})
export class ClientPartenaireModule {}
