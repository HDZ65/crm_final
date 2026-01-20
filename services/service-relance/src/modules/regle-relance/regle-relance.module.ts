import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegleRelanceEntity } from './entities/regle-relance.entity';
import { RegleRelanceService } from './regle-relance.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegleRelanceEntity])],
  providers: [RegleRelanceService],
  exports: [RegleRelanceService],
})
export class RegleRelanceModule {}
