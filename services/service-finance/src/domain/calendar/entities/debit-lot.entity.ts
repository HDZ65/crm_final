import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('debit_lot')
@Unique(['organisationId', 'societeId', 'name'])
@Index(['organisationId', 'societeId'])
@Index(['organisationId', 'isActive'])
export class DebitLotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'uuid' })
  @Index()
  societeId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int' })
  startDay: number;

  @Column({ type: 'int' })
  endDay: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  containsDay(day: number): boolean {
    return this.startDay <= day && day <= this.endDay;
  }
}
