import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('regles_cq')
@Index(['keycloakGroupId'])
export class RegleCQEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId: string;

  @Column({ name: 'type_produit', type: 'varchar' })
  typeProduit: string;

  @Column({ name: 'score_minimum', type: 'decimal', precision: 5, scale: 2, default: 80 })
  scoreMinimum: number;

  @Column({ name: 'auto_validation', type: 'boolean', default: false })
  autoValidation: boolean;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
