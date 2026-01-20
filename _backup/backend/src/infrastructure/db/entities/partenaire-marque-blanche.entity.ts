import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MembrePartenaireEntity } from './membre-partenaire.entity';

@Entity('partenairemarqueblanches')
export class PartenaireMarqueBlancheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  denomination: string;

  @Column()
  siren: string;

  @Column()
  numeroTVA: string;

  @Column()
  contactSupportEmail: string;

  @Column()
  telephone: string;

  @Column()
  statutId: string;

  @OneToMany(
    () => MembrePartenaireEntity,
    (membre) => membre.partenaireMarqueBlanche,
  )
  membres: MembrePartenaireEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
