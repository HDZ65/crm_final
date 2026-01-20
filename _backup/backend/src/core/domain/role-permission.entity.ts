import { BaseEntity } from './base.entity';

export interface RolePermissionProps {
  id?: string;
  roleId: string;
  permissionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RolePermissionEntity extends BaseEntity {
  roleId: string;
  permissionId: string;

  constructor(props: RolePermissionProps) {
    super(props);
    this.roleId = props.roleId;
    this.permissionId = props.permissionId;
  }

  // Add domain business logic methods here
}
