import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { SocieteEntity } from './societe.entity';

@Entity('acces_societes')
@Unique(['keycloakUserId', 'societeId'])
export class AccesSocieteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_user_id', type: 'varchar', length: 255 })
  keycloakUserId: string;

  @Column({ name: 'societe_id', type: 'uuid' })
  societeId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SocieteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'societe_id' })
  societe: SocieteEntity;
}
