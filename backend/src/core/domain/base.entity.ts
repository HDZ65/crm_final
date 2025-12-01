export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial?: Partial<BaseEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
