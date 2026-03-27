import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('address_snapshots')
export class AddressSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

   @Column({ name: 'organisation_id', type: 'uuid' })
   @Index()
   organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

   @Column({ type: 'varchar' })
   rue: string;

   @Column({ name: 'code_postal', type: 'varchar' })
   codePostal: string;

   @Column({ type: 'varchar' })
   ville: string;

   @Column({ type: 'varchar' })
   pays: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt: Date;
}
