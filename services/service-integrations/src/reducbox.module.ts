import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import { ReducBoxAccessEntity } from './domain/reducbox/entities/reducbox-access.entity';
import { ReducBoxAccessHistoryEntity } from './domain/reducbox/entities/reducbox-access-history.entity';
// Infrastructure services
import { ReducBoxAccessRepositoryService } from './infrastructure/persistence/typeorm/repositories/reducbox/reducbox-access.service';
import { ReducBoxAccessHistoryService } from './infrastructure/persistence/typeorm/repositories/reducbox/reducbox-access-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReducBoxAccessEntity, ReducBoxAccessHistoryEntity]),
  ],
  controllers: [],
  providers: [ReducBoxAccessRepositoryService, ReducBoxAccessHistoryService],
  exports: [ReducBoxAccessRepositoryService, ReducBoxAccessHistoryService],
})
export class ReducBoxModule {}
