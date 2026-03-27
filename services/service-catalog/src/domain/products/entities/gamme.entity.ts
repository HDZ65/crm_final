import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TypeGamme } from '../enums/type-gamme.enum';
import { ProduitEntity } from './produit.entity';

@Entity('gamme')
@Index(['keycloakGroupId', 'code'], { unique: true })
export class GammeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  @Index()
  keycloakGroupId: string;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  @Index()
  societeId: string | null;

  @Column({ length: 100 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icone: string | null;

  @Column({ name: 'scope', type: 'varchar', length: 50, nullable: true })
  scope: string | null;

  @Column({ name: 'is_global', type: 'boolean', default: false })
  isGlobal: boolean;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Column({ default: true })
  actif: boolean;

  // Hiérarchie parent-enfant
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index()
  parentId: string | null;

  @Column({ type: 'int', default: 0 })
  niveau: number;

  @Column({
    type: 'enum',
    enum: TypeGamme,
    default: TypeGamme.FAMILLE,
  })
  typeGamme: TypeGamme;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(
    () => GammeEntity,
    (gamme) => gamme.children,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  parent: GammeEntity | null;

  @OneToMany(
    () => GammeEntity,
    (gamme) => gamme.parent,
  )
  children: GammeEntity[];

  @OneToMany(
    () => ProduitEntity,
    (produit) => produit.gamme,
  )
  produits: ProduitEntity[];
}
