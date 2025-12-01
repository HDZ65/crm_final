import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('thememarques')
export class ThemeMarqueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  logoUrl: string;

  @Column()
  couleurPrimaire: string;

  @Column()
  couleurSecondaire: string;

  @Column()
  faviconUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
