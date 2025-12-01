export class PermissionDto {
  id: string;
  code: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }
}
