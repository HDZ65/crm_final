import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientBaseEntity } from './entities/client-base.entity';
import { ClientBaseService } from './client-base.service';
import { ClientBaseController } from './client-base.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientBaseEntity])],
  controllers: [ClientBaseController],
  providers: [ClientBaseService],
  exports: [ClientBaseService],
})
export class ClientBaseModule {}
