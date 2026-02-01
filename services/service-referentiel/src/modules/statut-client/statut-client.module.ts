import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutClient } from './entities/statut-client.entity';
import { StatutClientService } from './statut-client.service';
import { StatutClientController } from './statut-client.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutClient])],
  controllers: [StatutClientController],
  providers: [StatutClientService],
  exports: [StatutClientService],
})
export class StatutClientModule {}
