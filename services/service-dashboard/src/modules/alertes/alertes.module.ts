import { Module } from '@nestjs/common';
import { AlertesService } from './alertes.service';

@Module({
  providers: [AlertesService],
  exports: [AlertesService],
})
export class AlertesModule {}
