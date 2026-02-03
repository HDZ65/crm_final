import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransporteurCompteEntity } from './entities/transporteur-compte.entity';
import { TransporteurCompteService } from './transporteur-compte.service';
import { TransporteurCompteController } from './transporteur-compte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TransporteurCompteEntity])],
  controllers: [TransporteurCompteController],
  providers: [TransporteurCompteService],
  exports: [TransporteurCompteService],
})
export class TransporteurCompteModule {}
