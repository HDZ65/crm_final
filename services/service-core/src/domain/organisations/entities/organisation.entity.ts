import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organisations')
export class OrganisationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  siret: string | null;

  @Column({ type: 'text', nullable: true })
  adresse: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telephone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

   @Column({ type: 'varchar', length: 50, default: 'actif' })
   etat: string;

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
