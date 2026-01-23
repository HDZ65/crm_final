import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRecurrenteEntity } from './entities/commission-recurrente.entity';
import { RecurrenceService } from './recurrence.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionRecurrenteEntity])],
  providers: [RecurrenceService],
  exports: [RecurrenceService],
})
export class RecurrenceModule {}
