import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntrepriseEntity } from './entities/client-entreprise.entity';
import { ClientEntrepriseService } from './client-entreprise.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntrepriseEntity])],
  providers: [ClientEntrepriseService],
  exports: [ClientEntrepriseService],
})
export class ClientEntrepriseModule {}
