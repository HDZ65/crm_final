import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegleRelanceEntity } from './entities/regle-relance.entity';
import { RegleRelanceService } from './regle-relance.service';
import { RegleRelanceController } from './regle-relance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegleRelanceEntity])],
  controllers: [RegleRelanceController],
  providers: [RegleRelanceService],
  exports: [RegleRelanceService],
})
export class RegleRelanceModule {}
