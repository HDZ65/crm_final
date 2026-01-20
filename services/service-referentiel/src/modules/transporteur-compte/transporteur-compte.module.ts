import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransporteurCompte } from './entities/transporteur-compte.entity';
import { TransporteurCompteService } from './transporteur-compte.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransporteurCompte])],
  providers: [TransporteurCompteService],
  exports: [TransporteurCompteService],
})
export class TransporteurCompteModule {}
