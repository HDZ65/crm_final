import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('thememarques')
export class ThemeMarqueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'logo_url', type: 'text' })
  logoUrl: string;

  @Column({ name: 'couleur_primaire', type: 'varchar', length: 20 })
  couleurPrimaire: string;

  @Column({ name: 'couleur_secondaire', type: 'varchar', length: 20 })
  couleurSecondaire: string;

  @Column({ name: 'favicon_url', type: 'text' })
  faviconUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
