import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutClientEntity } from './entities/statut-client.entity';
import { StatutClientService } from './statut-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutClientEntity])],
  providers: [StatutClientService],
  exports: [StatutClientService],
})
export class StatutClientModule {}
