import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRecurrenteEntity } from './entities/commission-recurrente.entity';
import { RecurrenceService } from './recurrence.service';
import { RecurrenceController } from './recurrence.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionRecurrenteEntity])],
  controllers: [RecurrenceController],
  providers: [RecurrenceService],
  exports: [RecurrenceService],
})
export class RecurrenceModule {}
