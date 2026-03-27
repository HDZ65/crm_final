import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('statuts_commission')
export class StatutCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'ordre_affichage', type: 'int', default: 0 })
  ordreAffichage: number;
}
