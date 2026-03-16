import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  RaccordementEnergieEntity,
  EnergieStatusHistoryEntity,
} from './domain/energie/entities';

// Infrastructure services
import { RaccordementEnergieRepositoryService } from './infrastructure/persistence/typeorm/repositories/energie';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RaccordementEnergieEntity,
      EnergieStatusHistoryEntity,
    ]),
  ],
  controllers: [],
  providers: [RaccordementEnergieRepositoryService],
  exports: [RaccordementEnergieRepositoryService],
})
export class EnergieModule {}
