import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('statutclients')
export class StatutClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'ordre_affichage', type: 'int', default: 0 })
  ordreAffichage: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
