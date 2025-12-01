const fs = require('fs');
const path = require('path');

/**
 * Field definition.
 * @typedef {Object} FieldDefinition
 * @property {string} name
 * @property {'string'|'number'|'boolean'} type
 * @property {boolean} [optional]
 * @property {boolean} [isEmail]
 * @property {Object} [columnOptions]
 */

/**
 * Feature definition.
 * @typedef {Object} FeatureDefinition
 * @property {string} name - param-case feature name
 * @property {string} className - PascalCase entity name
 * @property {string} tableName - table & controller route name
 * @property {FieldDefinition[]} fields
 */

const baseDir = process.cwd();

/** @type {FeatureDefinition[]} */
const features = [
  {
    name: 'compte',
    className: 'Compte',
    tableName: 'comptes',
    fields: [
      { name: 'nom', type: 'string' },
      { name: 'etat', type: 'string' },
      { name: 'dateCreation', type: 'string' },
      { name: 'createdByUserId', type: 'string' },
    ],
  },
  {
    name: 'permission',
    className: 'Permission',
    tableName: 'permissions',
    fields: [
      { name: 'code', type: 'string' },
      { name: 'description', type: 'string' },
    ],
  },
  {
    name: 'role-permission',
    className: 'RolePermission',
    tableName: 'rolepermissions',
    fields: [
      { name: 'roleId', type: 'string' },
      { name: 'permissionId', type: 'string' },
    ],
  },
  {
    name: 'membre-compte',
    className: 'MembreCompte',
    tableName: 'membrecomptes',
    fields: [
      { name: 'compteId', type: 'string' },
      { name: 'utilisateurId', type: 'string' },
      { name: 'roleId', type: 'string' },
      { name: 'etat', type: 'string' },
      { name: 'dateInvitation', type: 'string', optional: true },
      { name: 'dateActivation', type: 'string', optional: true },
    ],
  },
  {
    name: 'invitation-compte',
    className: 'InvitationCompte',
    tableName: 'invitationcomptes',
    fields: [
      { name: 'compteId', type: 'string' },
      { name: 'emailInvite', type: 'string', isEmail: true },
      { name: 'roleId', type: 'string' },
      { name: 'token', type: 'string' },
      { name: 'expireAt', type: 'string' },
      { name: 'etat', type: 'string' },
    ],
  },
  {
    name: 'groupe',
    className: 'Groupe',
    tableName: 'groupes',
    fields: [
      { name: 'compteId', type: 'string' },
      { name: 'nom', type: 'string' },
      { name: 'description', type: 'string', optional: true },
      { name: 'type', type: 'string' },
    ],
  },
  {
    name: 'societe',
    className: 'Societe',
    tableName: 'societes',
    fields: [
      { name: 'compteId', type: 'string' },
      { name: 'raisonSociale', type: 'string' },
      { name: 'siren', type: 'string' },
      { name: 'numeroTVA', type: 'string' },
    ],
  },
  {
    name: 'groupe-societe',
    className: 'GroupeSociete',
    tableName: 'groupesocietes',
    fields: [
      { name: 'groupeId', type: 'string' },
      { name: 'societeId', type: 'string' },
    ],
  },
  {
    name: 'membre-groupe',
    className: 'MembreGroupe',
    tableName: 'membregroupes',
    fields: [
      { name: 'membreCompteId', type: 'string' },
      { name: 'groupeId', type: 'string' },
      { name: 'roleLocal', type: 'string' },
    ],
  },
  {
    name: 'affectation-groupe-client',
    className: 'AffectationGroupeClient',
    tableName: 'affectationgroupeclients',
    fields: [
      { name: 'groupeId', type: 'string' },
      { name: 'clientBaseId', type: 'string' },
    ],
  },
  {
    name: 'transporteur-compte',
    className: 'TransporteurCompte',
    tableName: 'transporteurcomptes',
    fields: [
      { name: 'type', type: 'string' },
      { name: 'compteId', type: 'string' },
      { name: 'contractNumber', type: 'string' },
      { name: 'password', type: 'string' },
      { name: 'labelFormat', type: 'string' },
      { name: 'actif', type: 'boolean' },
    ],
  },
  {
    name: 'expedition',
    className: 'Expedition',
    tableName: 'expeditions',
    fields: [
      { name: 'compteId', type: 'string' },
      { name: 'clientBaseId', type: 'string' },
      { name: 'contratId', type: 'string', optional: true },
      { name: 'transporteurCompteId', type: 'string' },
      { name: 'trackingNumber', type: 'string' },
      { name: 'etat', type: 'string' },
      { name: 'dateCreation', type: 'string' },
      { name: 'dateDernierStatut', type: 'string' },
      { name: 'labelUrl', type: 'string' },
    ],
  },
  {
    name: 'colis',
    className: 'Colis',
    tableName: 'colis',
    fields: [
      { name: 'expeditionId', type: 'string' },
      { name: 'poidsGr', type: 'number' },
      { name: 'longCm', type: 'number' },
      { name: 'largCm', type: 'number' },
      { name: 'hautCm', type: 'number' },
      { name: 'valeurDeclaree', type: 'number' },
      { name: 'contenu', type: 'string' },
    ],
  },
  {
    name: 'evenement-suivi',
    className: 'EvenementSuivi',
    tableName: 'evenementsuivis',
    fields: [
      { name: 'expeditionId', type: 'string' },
      { name: 'code', type: 'string' },
      { name: 'label', type: 'string' },
      { name: 'dateEvenement', type: 'string' },
      { name: 'lieu', type: 'string' },
      { name: 'raw', type: 'string' },
    ],
  },
];

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const writeFile = (relativePath, content) => {
  const filePath = path.join(baseDir, relativePath);
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${relativePath}`);
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Created ${relativePath}`);
};

const buildDomain = (feature) => {
  const lines = [];
  lines.push("import { BaseEntity } from './base.entity';", '');
  lines.push(`export interface ${feature.className}Props {`);
  lines.push('  id?: string;');
  feature.fields.forEach((field) => {
    const optional = field.optional ? '?' : '';
    const union = field.optional ? ' | null' : '';
    const tsType = field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string';
    lines.push(`  ${field.name}${optional}: ${tsType}${union};`);
  });
  lines.push('  createdAt?: Date;');
  lines.push('  updatedAt?: Date;');
  lines.push('}', '', `export class ${feature.className}Entity extends BaseEntity {`);
  feature.fields.forEach((field) => {
    const optional = field.optional ? '?' : '';
    const union = field.optional ? ' | null' : '';
    const tsType = field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string';
    lines.push(`  ${field.name}${optional}: ${tsType}${union};`);
  });
  lines.push('', `  constructor(props: ${feature.className}Props) {`);
  lines.push('    super(props);');
  feature.fields.forEach((field) => {
    lines.push(`    this.${field.name} = props.${field.name};`);
  });
  lines.push('  }', '', '  // Add domain business logic methods here', '}');
  return lines.join('\n');
};

const columnDecorator = (field) => {
  if (field.optional) {
    if (field.columnOptions) {
      return `  @Column(${JSON.stringify({ ...field.columnOptions, nullable: true })})`;
    }
    return "  @Column({ nullable: true })";
  }
  if (field.columnOptions) {
    return `  @Column(${JSON.stringify(field.columnOptions)})`;
  }
  return '  @Column()';
};

const buildOrmEntity = (feature) => {
  const lines = [];
  lines.push(
    "import {",
    "  Entity,",
    "  Column,",
    "  PrimaryGeneratedColumn,",
    "  CreateDateColumn,",
    "  UpdateDateColumn,",
    "} from 'typeorm';",
    '',
    `@Entity('${feature.tableName}')`,
    `export class ${feature.className}Entity {`,
    "  @PrimaryGeneratedColumn('uuid')",
    '  id: string;',
    ''
  );
  feature.fields.forEach((field, index) => {
    const decorator = columnDecorator(field);
    if (index > 0) {
      lines.push('');
    }
    lines.push(decorator);
    const tsType = field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string';
    const optional = field.optional ? '?' : '';
    const union = field.optional ? ' | null' : '';
    lines.push(`  ${field.name}${optional}: ${tsType}${union};`);
  });
  lines.push(
    '',
    '  @CreateDateColumn()',
    '  createdAt: Date;',
    '',
    '  @UpdateDateColumn()',
    '  updatedAt: Date;',
    '}'
  );
  return lines.join('\n');
};

const validatorImportsForField = (field) => {
  const imports = new Set();
  if (field.optional) {
    imports.add('IsOptional');
  }
  switch (field.type) {
    case 'string':
      imports.add('IsString');
      if (!field.optional) {
        imports.add('IsNotEmpty');
      }
      break;
    case 'number':
      imports.add('IsNumber');
      break;
    case 'boolean':
      imports.add('IsBoolean');
      break;
    default:
      imports.add('IsString');
      if (!field.optional) {
        imports.add('IsNotEmpty');
      }
  }
  if (field.isEmail) {
    imports.add('IsEmail');
  }
  return imports;
};

const buildCreateDto = (feature) => {
  const imports = new Set();
  feature.fields.forEach((field) => {
    validatorImportsForField(field).forEach((imp) => imports.add(imp));
  });
  const sortedImports = Array.from(imports).sort();
  const lines = [];
  if (sortedImports.length > 0) {
    lines.push(`import { ${sortedImports.join(', ')} } from 'class-validator';`, '');
  }
  lines.push(`export class Create${feature.className}Dto {`);
  feature.fields.forEach((field, index) => {
    const decorators = [];
    if (field.optional) {
      decorators.push('IsOptional');
    }
    if (field.isEmail) {
      decorators.push('IsEmail');
    }
    switch (field.type) {
      case 'string':
        decorators.push('IsString');
        if (!field.optional) {
          decorators.push('IsNotEmpty');
        }
        break;
      case 'number':
        decorators.push('IsNumber');
        break;
      case 'boolean':
        decorators.push('IsBoolean');
        break;
      default:
        decorators.push('IsString');
        if (!field.optional) {
          decorators.push('IsNotEmpty');
        }
    }
    decorators.forEach((decorator) => {
      lines.push(`  @${decorator}()`);
    });
    const optional = field.optional ? '?' : '';
    const union = field.optional ? ' | null' : '';
    const tsType = field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string';
    lines.push(`  ${field.name}${optional}: ${tsType}${union};`);
    if (index < feature.fields.length - 1) {
      lines.push('');
    }
  });
  lines.push('}');
  return lines.join('\n');
};

const buildUpdateDto = (feature) => {
  return (
    "import { PartialType } from '@nestjs/mapped-types';\n" +
    `import { Create${feature.className}Dto } from './create-${feature.name}.dto';\n\n` +
    `export class Update${feature.className}Dto extends PartialType(Create${feature.className}Dto) {}\n`
  );
};

const buildResponseDto = (feature) => {
  const lines = [];
  lines.push(`export class ${feature.className}Dto {`);
  lines.push('  id: string;');
  feature.fields.forEach((field) => {
    const optional = field.optional ? '?' : '';
    const union = field.optional ? ' | null' : '';
    const tsType = field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string';
    lines.push(`  ${field.name}${optional}: ${tsType}${union};`);
  });
  lines.push('  createdAt: Date;');
  lines.push('  updatedAt: Date;', '', `  constructor(partial: Partial<${feature.className}Dto>) {`);
  lines.push('    Object.assign(this, partial);');
  lines.push('  }', '}');
  return lines.join('\n');
};

const buildMapper = (feature) => {
  const lines = [];
  lines.push(
    `import { ${feature.className}Entity } from '../../core/domain/${feature.name}.entity';`,
    `import { ${feature.className}Entity as ${feature.className}OrmEntity } from '../../infrastructure/db/entities/${feature.name}.entity';`,
    '',
    `export class ${feature.className}Mapper {`,
    `  static toDomain(ormEntity: ${feature.className}OrmEntity): ${feature.className}Entity {`,
    `    return new ${feature.className}Entity({`,
    '      id: ormEntity.id,'
  );
  feature.fields.forEach((field) => {
    lines.push(`      ${field.name}: ormEntity.${field.name},`);
  });
  lines.push('      createdAt: ormEntity.createdAt,');
  lines.push('      updatedAt: ormEntity.updatedAt,');
  lines.push('    });', '  }', '', `  static toPersistence(entity: ${feature.className}Entity): Partial<${feature.className}OrmEntity> {`);
  lines.push('    return {');
  lines.push('      id: entity.id,');
  feature.fields.forEach((field) => {
    lines.push(`      ${field.name}: entity.${field.name},`);
  });
  lines.push('      createdAt: entity.createdAt,');
  lines.push('      updatedAt: entity.updatedAt,');
  lines.push('    };', '  }', '}');
  return lines.join('\n');
};

const buildRepositoryPort = (feature) => {
  return (
    `import { ${feature.className}Entity } from '../domain/${feature.name}.entity';\n` +
    "import { BaseRepositoryPort } from './repository.port';\n\n" +
    '// eslint-disable-next-line @typescript-eslint/no-empty-object-type\n' +
    `export interface ${feature.className}RepositoryPort extends BaseRepositoryPort<${feature.className}Entity> {\n` +
    '  // Add custom repository methods here\n' +
    '}\n'
  );
};

const buildTypeOrmRepository = (feature) => {
  const className = feature.className;
  const lines = [];
  lines.push(
    "import { Injectable } from '@nestjs/common';",
    "import { InjectRepository } from '@nestjs/typeorm';",
    "import { Repository } from 'typeorm';",
    `import type { ${className}RepositoryPort } from '../../core/port/${feature.name}-repository.port';`,
    `import type { ${className}Entity as ${className}DomainEntity } from '../../core/domain/${feature.name}.entity';`,
    `import { ${className}Entity as ${className}OrmEntity } from '../db/entities/${feature.name}.entity';`,
    `import { ${className}Mapper } from '../../applications/mapper/${feature.name}.mapper';`,
    '',
    '@Injectable()',
    `export class TypeOrm${className}Repository implements ${className}RepositoryPort {`,
    '  constructor(',
    `    @InjectRepository(${className}OrmEntity)`,
    `    private readonly repository: Repository<${className}OrmEntity>,`,
    '  ) {}',
    '',
    `  async findById(id: string): Promise<${className}DomainEntity | null> {`,
    '    const entity = await this.repository.findOne({ where: { id } });',
    `    return entity ? ${className}Mapper.toDomain(entity) : null;`,
    '  }',
    '',
    `  async findAll(): Promise<${className}DomainEntity[]> {`,
    '    const entities = await this.repository.find();',
    `    return entities.map((entity) => ${className}Mapper.toDomain(entity));`,
    '  }',
    '',
    `  async create(entity: ${className}DomainEntity): Promise<${className}DomainEntity> {`,
    '    const ormEntity = this.repository.create(',
    `      ${className}Mapper.toPersistence(entity),`,
    '    );',
    '    const saved = await this.repository.save(ormEntity);',
    `    return ${className}Mapper.toDomain(saved);`,
    '  }',
    '',
    `  async update(id: string, entity: Partial<${className}DomainEntity>): Promise<${className}DomainEntity> {`,
    '    await this.repository.update(',
    '      id,',
    `      ${className}Mapper.toPersistence(entity as ${className}DomainEntity),`,
    '    );',
    '    const updated = await this.repository.findOne({ where: { id } });',
    `    return ${className}Mapper.toDomain(updated!);`,
    '  }',
    '',
    '  async delete(id: string): Promise<void> {',
    '    await this.repository.delete(id);',
    '  }',
    '}'
  );
  return lines.join('\n');
};

const buildCreateUseCase = (feature) => {
  const className = feature.className;
  const lines = [];
  lines.push(
    "import { Injectable, Inject } from '@nestjs/common';",
    `import { ${className}Entity } from '../../../core/domain/${feature.name}.entity';`,
    `import type { ${className}RepositoryPort } from '../../../core/port/${feature.name}-repository.port';`,
    `import { Create${className}Dto } from '../../dto/${feature.name}/create-${feature.name}.dto';`,
    '',
    '@Injectable()',
    `export class Create${className}UseCase {`,
    '  constructor(',
    `    @Inject('${className}RepositoryPort')`,
    `    private readonly repository: ${className}RepositoryPort,`,
    '  ) {}',
    '',
    `  async execute(dto: Create${className}Dto): Promise<${className}Entity> {`,
    `    const entity = new ${className}Entity({`
  );
  feature.fields.forEach((field) => {
    const value =
      field.optional && field.type !== 'boolean' && field.type !== 'number'
        ? `dto.${field.name} ?? null`
        : field.optional && (field.type === 'number' || field.type === 'boolean')
        ? `dto.${field.name}`
        : `dto.${field.name}`;
    lines.push(`      ${field.name}: ${value},`);
  });
  lines.push('      createdAt: new Date(),');
  lines.push('      updatedAt: new Date(),');
  lines.push('    });', '', '    // Add business logic here (if needed)', '', '    return await this.repository.create(entity);', '  }', '}');
  return lines.join('\n');
};

const buildGetUseCase = (feature) => {
  const className = feature.className;
  return (
    "import { Injectable, Inject, NotFoundException } from '@nestjs/common';\n" +
    `import { ${className}Entity } from '../../../core/domain/${feature.name}.entity';\n` +
    `import type { ${className}RepositoryPort } from '../../../core/port/${feature.name}-repository.port';\n\n` +
    '@Injectable()\n' +
    `export class Get${className}UseCase {\n` +
    '  constructor(\n' +
    `    @Inject('${className}RepositoryPort')\n` +
    `    private readonly repository: ${className}RepositoryPort,\n` +
    '  ) {}\n\n' +
    `  async execute(id: string): Promise<${className}Entity> {\n` +
    '    const entity = await this.repository.findById(id);\n\n' +
    '    if (!entity) {\n' +
    `      throw new NotFoundException('${className} with id ' + id + ' not found');\n` +
    '    }\n\n' +
    '    return entity;\n' +
    '  }\n\n' +
    `  async executeAll(): Promise<${className}Entity[]> {\n` +
    '    return await this.repository.findAll();\n' +
    '  }\n' +
    '}\n'
  );
};

const buildUpdateUseCase = (feature) => {
  const className = feature.className;
  const lines = [];
  lines.push(
    "import { Injectable, Inject, NotFoundException } from '@nestjs/common';",
    `import { ${className}Entity } from '../../../core/domain/${feature.name}.entity';`,
    `import type { ${className}RepositoryPort } from '../../../core/port/${feature.name}-repository.port';`,
    `import { Update${className}Dto } from '../../dto/${feature.name}/update-${feature.name}.dto';`,
    '',
    '@Injectable()',
    `export class Update${className}UseCase {`,
    '  constructor(',
    `    @Inject('${className}RepositoryPort')`,
    `    private readonly repository: ${className}RepositoryPort,`,
    '  ) {}',
    '',
    `  async execute(id: string, dto: Update${className}Dto): Promise<${className}Entity> {`,
    '    const existing = await this.repository.findById(id);',
    '',
    '    if (!existing) {',
    `      throw new NotFoundException('${className} with id ' + id + ' not found');`,
    '    }',
    ''
  );
  feature.fields.forEach((field) => {
    lines.push(`    if (dto.${field.name} !== undefined) {`);
    lines.push(`      existing.${field.name} = dto.${field.name};`);
    lines.push('    }');
  });
  lines.push(
    '    existing.updatedAt = new Date();',
    '',
    '    // Add business logic here (if needed)',
    '',
    '    return await this.repository.update(id, existing);',
    '  }',
    '}'
  );
  return lines.join('\n');
};

const buildDeleteUseCase = (feature) => {
  const className = feature.className;
  return (
    "import { Injectable, Inject, NotFoundException } from '@nestjs/common';\n" +
    `import type { ${className}RepositoryPort } from '../../../core/port/${feature.name}-repository.port';\n\n` +
    '@Injectable()\n' +
    `export class Delete${className}UseCase {\n` +
    '  constructor(\n' +
    `    @Inject('${className}RepositoryPort')\n` +
    `    private readonly repository: ${className}RepositoryPort,\n` +
    '  ) {}\n\n' +
    '  async execute(id: string): Promise<void> {\n' +
    '    const existing = await this.repository.findById(id);\n\n' +
    '    if (!existing) {\n' +
    `      throw new NotFoundException('${className} with id ' + id + ' not found');\n` +
    '    }\n\n' +
    '    await this.repository.delete(id);\n' +
    '  }\n' +
    '}\n'
  );
};

const buildController = (feature) => {
  const className = feature.className;
  const lines = [];
  lines.push(
    'import {',
    '  Controller,',
    '  Get,',
    '  Post,',
    '  Put,',
    '  Delete,',
    '  Body,',
    '  Param,',
    '  HttpCode,',
    '  HttpStatus,',
    "} from '@nestjs/common';",
    `import { Create${className}Dto } from '../../../../applications/dto/${feature.name}/create-${feature.name}.dto';`,
    `import { Update${className}Dto } from '../../../../applications/dto/${feature.name}/update-${feature.name}.dto';`,
    `import { ${className}Dto } from '../../../../applications/dto/${feature.name}/${feature.name}-response.dto';`,
    `import { Create${className}UseCase } from '../../../../applications/usecase/${feature.name}/create-${feature.name}.usecase';`,
    `import { Get${className}UseCase } from '../../../../applications/usecase/${feature.name}/get-${feature.name}.usecase';`,
    `import { Update${className}UseCase } from '../../../../applications/usecase/${feature.name}/update-${feature.name}.usecase';`,
    `import { Delete${className}UseCase } from '../../../../applications/usecase/${feature.name}/delete-${feature.name}.usecase';`,
    '',
    `@Controller('${feature.tableName}')`,
    `export class ${className}Controller {`,
    '  constructor(',
    `    private readonly createUseCase: Create${className}UseCase,`,
    `    private readonly getUseCase: Get${className}UseCase,`,
    `    private readonly updateUseCase: Update${className}UseCase,`,
    `    private readonly deleteUseCase: Delete${className}UseCase,`,
    '  ) {}',
    '',
    '  @Post()',
    '  @HttpCode(HttpStatus.CREATED)',
    `  async create(@Body() dto: Create${className}Dto): Promise<${className}Dto> {`,
    '    const entity = await this.createUseCase.execute(dto);',
    `    return new ${className}Dto(entity);`,
    '  }',
    '',
    '  @Get()',
    `  async findAll(): Promise<${className}Dto[]> {`,
    '    const entities = await this.getUseCase.executeAll();',
    `    return entities.map((entity) => new ${className}Dto(entity));`,
    '  }',
    '',
    "  @Get(':id')",
    `  async findOne(@Param('id') id: string): Promise<${className}Dto> {`,
    '    const entity = await this.getUseCase.execute(id);',
    `    return new ${className}Dto(entity);`,
    '  }',
    '',
    "  @Put(':id')",
    `  async update(@Param('id') id: string, @Body() dto: Update${className}Dto): Promise<${className}Dto> {`,
    '    const entity = await this.updateUseCase.execute(id, dto);',
    `    return new ${className}Dto(entity);`,
    '  }',
    '',
    "  @Delete(':id')",
    '  @HttpCode(HttpStatus.NO_CONTENT)',
    "  async remove(@Param('id') id: string): Promise<void> {",
    '    await this.deleteUseCase.execute(id);',
    '  }',
    '}'
  );
  return lines.join('\n');
};

features.forEach((feature) => {
  writeFile(`src/core/domain/${feature.name}.entity.ts`, buildDomain(feature));
  writeFile(
    `src/infrastructure/db/entities/${feature.name}.entity.ts`,
    buildOrmEntity(feature)
  );
  writeFile(
    `src/applications/dto/${feature.name}/create-${feature.name}.dto.ts`,
    buildCreateDto(feature)
  );
  writeFile(
    `src/applications/dto/${feature.name}/update-${feature.name}.dto.ts`,
    buildUpdateDto(feature)
  );
  writeFile(
    `src/applications/dto/${feature.name}/${feature.name}-response.dto.ts`,
    buildResponseDto(feature)
  );
  writeFile(
    `src/applications/mapper/${feature.name}.mapper.ts`,
    buildMapper(feature)
  );
  writeFile(
    `src/core/port/${feature.name}-repository.port.ts`,
    buildRepositoryPort(feature)
  );
  writeFile(
    `src/infrastructure/repositories/typeorm-${feature.name}.repository.ts`,
    buildTypeOrmRepository(feature)
  );
  writeFile(
    `src/applications/usecase/${feature.name}/create-${feature.name}.usecase.ts`,
    buildCreateUseCase(feature)
  );
  writeFile(
    `src/applications/usecase/${feature.name}/get-${feature.name}.usecase.ts`,
    buildGetUseCase(feature)
  );
  writeFile(
    `src/applications/usecase/${feature.name}/update-${feature.name}.usecase.ts`,
    buildUpdateUseCase(feature)
  );
  writeFile(
    `src/applications/usecase/${feature.name}/delete-${feature.name}.usecase.ts`,
    buildDeleteUseCase(feature)
  );
  writeFile(
    `src/infrastructure/framework/nest/http/${feature.name}.controller.ts`,
    buildController(feature)
  );
});

console.log('Generation completed.');
