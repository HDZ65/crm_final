export declare abstract class BaseOrmEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export declare abstract class VersionedOrmEntity extends BaseOrmEntity {
    version: number;
}
//# sourceMappingURL=base.orm-entity.d.ts.map