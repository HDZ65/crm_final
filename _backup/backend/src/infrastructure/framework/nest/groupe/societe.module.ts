import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controller
import { SocieteController } from './controllers/societe.controller';

// Entity
import { SocieteEntity } from '../../../db/entities/societe.entity';

// Use Cases
import { CreateSocieteUseCase } from '../../../../applications/usecase/societe/create-societe.usecase';
import { GetSocieteUseCase } from '../../../../applications/usecase/societe/get-societe.usecase';
import { UpdateSocieteUseCase } from '../../../../applications/usecase/societe/update-societe.usecase';
import { DeleteSocieteUseCase } from '../../../../applications/usecase/societe/delete-societe.usecase';

// Repository
import { TypeOrmSocieteRepository } from '../../../repositories/typeorm-societe.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SocieteEntity])],
  controllers: [SocieteController],
  providers: [
    // Use Cases
    CreateSocieteUseCase,
    GetSocieteUseCase,
    UpdateSocieteUseCase,
    DeleteSocieteUseCase,
    // Repository
    {
      provide: 'SocieteRepositoryPort',
      useClass: TypeOrmSocieteRepository,
    },
  ],
  exports: [
    CreateSocieteUseCase,
    GetSocieteUseCase,
    UpdateSocieteUseCase,
    DeleteSocieteUseCase,
  ],
})
export class SocieteModule {}
