import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntrepriseEntity } from './entities/client-entreprise.entity';
import { ClientEntrepriseService } from './client-entreprise.service';
import { ClientEntrepriseController } from './client-entreprise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntrepriseEntity])],
  controllers: [ClientEntrepriseController],
  providers: [ClientEntrepriseService],
  exports: [ClientEntrepriseService],
})
export class ClientEntrepriseModule {}
