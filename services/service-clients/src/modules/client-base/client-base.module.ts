import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientBaseEntity } from './entities/client-base.entity';
import { ClientBaseService } from './client-base.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientBaseEntity])],
  providers: [ClientBaseService],
  exports: [ClientBaseService],
})
export class ClientBaseModule {}
