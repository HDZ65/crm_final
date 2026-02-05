import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Entity('rolepermissions')
@Unique(['roleId', 'permissionId'])
export class RolePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @ManyToOne(() => PermissionEntity)
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionEntity;
}
