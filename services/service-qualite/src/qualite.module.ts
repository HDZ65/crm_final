import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import { ControleQualiteEntity } from './domain/qualite/entities/controle-qualite.entity';
import { CritereCQEntity } from './domain/qualite/entities/critere-cq.entity';
import { RegleCQEntity } from './domain/qualite/entities/regle-cq.entity';
import { RegleCQCritereEntity } from './domain/qualite/entities/regle-cq-critere.entity';
import { ResultatCritereEntity } from './domain/qualite/entities/resultat-critere.entity';
import { StatutCQEntity } from './domain/qualite/entities/statut-cq.entity';
// Infrastructure - gRPC controllers
import { QualiteController } from './infrastructure/grpc/qualite/qualite.controller';
// Infrastructure - Persistence services
import { ControleQualiteService } from './infrastructure/persistence/typeorm/repositories/qualite/controle-qualite.service';
import { CritereCqService } from './infrastructure/persistence/typeorm/repositories/qualite/critere-cq.service';
import { RegleCqService } from './infrastructure/persistence/typeorm/repositories/qualite/regle-cq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ControleQualiteEntity,
      CritereCQEntity,
      RegleCQEntity,
      RegleCQCritereEntity,
      ResultatCritereEntity,
      StatutCQEntity,
    ]),
  ],
  controllers: [QualiteController],
  providers: [
    ControleQualiteService,
    CritereCqService,
    RegleCqService,
  ],
  exports: [
    ControleQualiteService,
    CritereCqService,
    RegleCqService,
  ],
})
export class QualiteModule {}
