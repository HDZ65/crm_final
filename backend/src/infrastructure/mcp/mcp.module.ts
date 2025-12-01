// src/mcp/mcp.module.ts
import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpGrpcService } from '../grpc/mcp-grpc.service';

// Client Base
import { CreateClientBaseUseCase } from '../../applications/usecase/client-base/create-client-base.usecase';
import { GetClientBaseUseCase } from '../../applications/usecase/client-base/get-client-base.usecase';
import { UpdateClientBaseUseCase } from '../../applications/usecase/client-base/update-client-base.usecase';
import { DeleteClientBaseUseCase } from '../../applications/usecase/client-base/delete-client-base.usecase';
import { ClientBaseEntity } from '../db/entities/client-base.entity';
import { TypeOrmClientBaseRepository } from '../repositories/typeorm-client-base.repository';

// Contrat
import { CreateContratUseCase } from '../../applications/usecase/contrat/create-contrat.usecase';
import { GetContratUseCase } from '../../applications/usecase/contrat/get-contrat.usecase';
import { UpdateContratUseCase } from '../../applications/usecase/contrat/update-contrat.usecase';
import { DeleteContratUseCase } from '../../applications/usecase/contrat/delete-contrat.usecase';
import { ContratEntity } from '../db/entities/contrat.entity';
import { TypeOrmContratRepository } from '../repositories/typeorm-contrat.repository';

// Facture
import { CreateFactureUseCase } from '../../applications/usecase/facture/create-facture.usecase';
import { GetFactureUseCase } from '../../applications/usecase/facture/get-facture.usecase';
import { UpdateFactureUseCase } from '../../applications/usecase/facture/update-facture.usecase';
import { DeleteFactureUseCase } from '../../applications/usecase/facture/delete-facture.usecase';
import { FactureEntity } from '../db/entities/facture.entity';
import { TypeOrmFactureRepository } from '../repositories/typeorm-facture.repository';

// Activite
import { CreateActiviteUseCase } from '../../applications/usecase/activite/create-activite.usecase';
import { GetActiviteUseCase } from '../../applications/usecase/activite/get-activite.usecase';
import { UpdateActiviteUseCase } from '../../applications/usecase/activite/update-activite.usecase';
import { DeleteActiviteUseCase } from '../../applications/usecase/activite/delete-activite.usecase';
import { ActiviteEntity } from '../db/entities/activite.entity';
import { TypeOrmActiviteRepository } from '../repositories/typeorm-activite.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientBaseEntity,
      ContratEntity,
      FactureEntity,
      ActiviteEntity,
    ]),
  ],
  providers: [
    McpService,
    McpGrpcService,

    // ClientBase
    { provide: 'ClientBaseRepositoryPort', useClass: TypeOrmClientBaseRepository },
    CreateClientBaseUseCase,
    GetClientBaseUseCase,
    UpdateClientBaseUseCase,
    DeleteClientBaseUseCase,

    // Contrat
    { provide: 'ContratRepositoryPort', useClass: TypeOrmContratRepository },
    CreateContratUseCase,
    GetContratUseCase,
    UpdateContratUseCase,
    DeleteContratUseCase,

    // Facture
    { provide: 'FactureRepositoryPort', useClass: TypeOrmFactureRepository },
    CreateFactureUseCase,
    GetFactureUseCase,
    UpdateFactureUseCase,
    DeleteFactureUseCase,

    // Activite
    { provide: 'ActiviteRepositoryPort', useClass: TypeOrmActiviteRepository },
    CreateActiviteUseCase,
    GetActiviteUseCase,
    UpdateActiviteUseCase,
    DeleteActiviteUseCase,
  ],
  exports: [McpService, McpGrpcService],
})
export class McpModule {}
