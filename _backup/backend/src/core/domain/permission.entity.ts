import { BaseEntity } from './base.entity';

export interface PermissionProps {
  id?: string;
  code: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PermissionEntity extends BaseEntity {
  code: string;
  description: string;

  constructor(props: PermissionProps) {
    super(props);
    this.code = props.code;
    this.description = props.description;
  }

  // Add domain business logic methods here
}
