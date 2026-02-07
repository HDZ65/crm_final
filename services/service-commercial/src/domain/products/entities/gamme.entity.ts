import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Index,
} from 'typeorm';
import { ProduitEntity } from './produit.entity';
import { TypeGamme } from '../enums/type-gamme.enum';

@Entity('gamme')
@Index(['organisationId', 'code'], { unique: true })
export class GammeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icone: string | null;

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
   @ManyToOne(() => GammeEntity, (gamme) => gamme.children, {
     nullable: true,
     onDelete: 'SET NULL',
   })
   parent: GammeEntity | null;

   @OneToMany(() => GammeEntity, (gamme) => gamme.parent)
   children: GammeEntity[];

   @OneToMany(() => ProduitEntity, (produit) => produit.gamme)
   produits: ProduitEntity[];
}
