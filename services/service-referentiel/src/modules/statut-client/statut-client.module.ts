import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutClient } from './entities/statut-client.entity';
import { StatutClientService } from './statut-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutClient])],
  providers: [StatutClientService],
  exports: [StatutClientService],
})
export class StatutClientModule {}
