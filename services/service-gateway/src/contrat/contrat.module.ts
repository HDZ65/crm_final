import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { NatsPublisherModule } from '../nats/nats-publisher.module';
import { ContratController } from './contrat.controller';

@Module({
  imports: [AuthModule, NatsPublisherModule, GrpcClientModule],
  controllers: [ContratController],
})
export class ContratModule {}
