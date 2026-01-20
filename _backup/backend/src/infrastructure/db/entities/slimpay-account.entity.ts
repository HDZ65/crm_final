import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EncryptedColumnTransformer } from '../transformers/encrypted-column.transformer';
import { SocieteEntity } from './societe.entity';

@Entity('slimpay_accounts')
@Index(['societeId'], { unique: true })
export class SlimpayAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  societeId: string;

  @ManyToOne(() => SocieteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column()
  nom: string;

  @Column({
    type: 'text',
    transformer: EncryptedColumnTransformer,
  })
  appId: string;

  @Column({
    type: 'text',
    transformer: EncryptedColumnTransformer,
  })
  appSecret: string;

  @Column()
  creditorReference: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'preprod',
  })
  environment: 'preprod' | 'production';

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
