import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { GroupeEntity } from './groupe.entity';
import { SocieteEntity } from './societe.entity';

@Entity('groupeentites')
@Unique(['groupeId', 'entiteId']) // Empêche les doublons groupe-entité
export class GroupeEntiteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupeId: string;

  @ManyToOne(() => GroupeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupeId' })
  groupe: GroupeEntity;

  @Column()
  entiteId: string;

  @ManyToOne(() => SocieteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entiteId' })
  entite: SocieteEntity;

  @Column({ nullable: true })
  type?: string; // société, agence, filiale, département, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
