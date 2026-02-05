import { ThemeMarqueEntity } from '../entities/theme-marque.entity';

export interface IThemeMarqueRepository {
  findById(id: string): Promise<ThemeMarqueEntity | null>;
  findAll(): Promise<ThemeMarqueEntity[]>;
  save(entity: ThemeMarqueEntity): Promise<ThemeMarqueEntity>;
  delete(id: string): Promise<void>;
}
