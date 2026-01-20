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

@Entity('gocardless_accounts')
@Index(['societeId'], { unique: true })
export class GoCardlessAccountEntity {
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
  accessToken: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: EncryptedColumnTransformer,
  })
  webhookSecret: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'sandbox',
  })
  environment: 'sandbox' | 'live';

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
