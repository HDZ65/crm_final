import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('subscription_lines')
export class SubscriptionLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ name: 'prix_unitaire', type: 'decimal', precision: 15, scale: 2 })
  prixUnitaire: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne('SubscriptionEntity', 'lines')
  @JoinColumn({ name: 'subscription_id' })
  subscription: any;
}
