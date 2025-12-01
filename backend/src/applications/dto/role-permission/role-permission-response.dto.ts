export class RolePermissionDto {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RolePermissionDto>) {
    Object.assign(this, partial);
  }
}
