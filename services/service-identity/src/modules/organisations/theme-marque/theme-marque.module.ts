import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeMarqueEntity } from './entities/theme-marque.entity';
import { ThemeMarqueService } from './theme-marque.service';
import { ThemeMarqueController } from './theme-marque.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeMarqueEntity])],
  controllers: [ThemeMarqueController],
  providers: [ThemeMarqueService],
  exports: [ThemeMarqueService],
})
export class ThemeMarqueModule {}
