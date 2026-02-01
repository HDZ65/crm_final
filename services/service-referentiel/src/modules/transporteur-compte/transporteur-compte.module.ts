import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransporteurCompte } from './entities/transporteur-compte.entity';
import { TransporteurCompteService } from './transporteur-compte.service';
import { TransporteurCompteController } from './transporteur-compte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TransporteurCompte])],
  controllers: [TransporteurCompteController],
  providers: [TransporteurCompteService],
  exports: [TransporteurCompteService],
})
export class TransporteurCompteModule {}
