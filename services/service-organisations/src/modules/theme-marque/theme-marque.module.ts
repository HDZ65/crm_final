import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeMarqueEntity } from './entities/theme-marque.entity';
import { ThemeMarqueService } from './theme-marque.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeMarqueEntity])],
  providers: [ThemeMarqueService],
  exports: [ThemeMarqueService],
})
export class ThemeMarqueModule {}
