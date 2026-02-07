import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import { ConsentementEntity } from './domain/depanssur/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsentementEntity,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class DepanssurModule {}
