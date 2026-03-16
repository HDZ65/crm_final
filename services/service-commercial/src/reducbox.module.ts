import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities — ReducBox
import {
  ReducBoxAccessEntity,
  ReducBoxAccessHistoryEntity,
} from './domain/reducbox/entities';

// Infrastructure services (repositories) — ReducBox
import { ReducBoxAccessRepositoryService } from './infrastructure/persistence/typeorm/repositories/reducbox';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReducBoxAccessEntity,
      ReducBoxAccessHistoryEntity,
    ]),
  ],
  controllers: [],
  providers: [
    ReducBoxAccessRepositoryService,
  ],
  exports: [
    ReducBoxAccessRepositoryService,
  ],
})
export class ReducBoxModule {}
