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

@Entity('multisafepay_accounts')
@Index(['societeId'], { unique: true })
export class MultisafepayAccountEntity {
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
  apiKey: string;

  @Column({ type: 'varchar', nullable: true })
  siteId: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: EncryptedColumnTransformer,
  })
  secureCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountId: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'test',
  })
  environment: 'test' | 'live';

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
