import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientpartenaires')
export class ClientPartenaireEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientBaseId: string;

  @Column()
  partenaireId: string;

  @Column()
  rolePartenaireId: string;

  @Column()
  validFrom: string;

  @Column()
  validTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
