import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TypeCritere } from '../enums/statut-cq.enum';

@Entity('criteres_cq')
@Index(['keycloakGroupId'])
@Unique(['keycloakGroupId', 'code'])
export class CritereCQEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'type_critere', type: 'varchar', enum: TypeCritere })
  typeCritere: TypeCritere;

  @Column({ type: 'boolean', default: true })
  obligatoire: boolean;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ type: 'integer', default: 0 })
  ordre: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
