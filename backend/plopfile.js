const path = require('path');
const fs = require('fs');
const changeCase = require('change-case');
const { spawnSync } = require('child_process');

const coerceText = (value) => (value === undefined || value === null ? '' : String(value));

const normalizeDbValue = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => coerceText(v).toLowerCase());
  const str = coerceText(value).toLowerCase();
  if (str === 'both') return ['postgres', 'mongo'];
  return [str];
};

const toPascalCase = (text) => {
  const input = coerceText(text);
  return changeCase.pascalCase ? changeCase.pascalCase(input) : input;
};

const toCamelCase = (text) => {
  const input = coerceText(text);
  return changeCase.camelCase ? changeCase.camelCase(input) : input;
};

const toParamCase = (text) => {
  const input = coerceText(text);
  if (changeCase.paramCase) return changeCase.paramCase(input);
  if (changeCase.kebabCase) return changeCase.kebabCase(input);
  return input;
};

const simplePluralize = (value) => {
  const word = coerceText(value);
  if (!word) return word;
  if (/[^aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }
  if (/s$/i.test(word)) {
    return word;
  }
  return `${word}s`;
};

const isPostgres = (value) => normalizeDbValue(value).includes('postgres');
const isMongo = (value) => normalizeDbValue(value).includes('mongo');

const hasDependency = (pkgJson, name) => {
  if (!pkgJson) return false;
  return Boolean(
    pkgJson.dependencies?.[name] ||
    pkgJson.devDependencies?.[name] ||
    pkgJson.peerDependencies?.[name]
  );
};

const readPackageJson = (cwd) => {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const serializeDependencyCommand = (deps, packageManager = 'npm') => {
  if (!deps.length) return null;
  switch (packageManager) {
    case 'pnpm':
      return ['pnpm', ['add', ...deps]];
    case 'yarn':
      return ['yarn', ['add', ...deps]];
    default:
      return ['npm', ['install', ...deps]];
  }
};

const detectPackageManager = (cwd) => {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
};

module.exports = function (plop) {
  plop.setHelper('pascalCase', (text) => toPascalCase(text));
  plop.setHelper('camelCase', (text) => toCamelCase(text));
  plop.setHelper('paramCase', (text) => toParamCase(text));
  plop.setHelper('kebabCase', (text) => toParamCase(text));
  plop.setHelper('plural', (text) => simplePluralize(text));
  plop.setHelper('isPostgres', (value) => isPostgres(value));
  plop.setHelper('isMongo', (value) => isMongo(value));

  plop.setHelper('eq', (a, b) => a === b);
  plop.setHelper('includes', (arr, val) => {
    if (Array.isArray(arr)) {
      return arr.includes(val);
    }
    return false;
  });

  plop.setHelper('hasField', (fields, fieldName) => {
    if (!Array.isArray(fields)) {
      return false;
    }
    return fields.some((field) => field && typeof field.name === 'string' && field.name.trim() === fieldName);
  });

  // Dynamic templates path - works from node_modules or local
  const localTemplatesPath = path.join(__dirname, 'templates');
  let templatesPath = localTemplatesPath;

  if (!fs.existsSync(localTemplatesPath)) {
    try {
      const packagePlopPath = require.resolve('nestjs-clean-generator/plopfile.js');
      const packageTemplates = path.join(path.dirname(packagePlopPath), 'templates');
      if (fs.existsSync(packageTemplates)) {
        templatesPath = packageTemplates;
      }
    } catch (error) {
      // Fall back to local path when package resolution fails
    }
  }

  plop.setGenerator('feature', {
    description: 'Generate a complete feature with Clean Architecture',
    prompts: async (inquirer) => {
      const basePrompts = [
        {
          type: 'input',
          name: 'featureName',
          message: 'Feature name (e.g., User, Product):',
          validate: (value) => {
            if (!value) return 'Feature name is required';
            return true;
          },
        },
        {
          type: 'input',
          name: 'entityName',
          message: 'Entity name (optional, defaults to feature name):',
          default: (answers) => answers.featureName,
        },
        {
          type: 'list',
          name: 'dbType',
          message: 'Which database(s) do you want to support?',
          choices: ['postgres', 'mongo', 'both'],
          default: 'postgres',
        },
        {
          type: 'confirm',
          name: 'generateController',
          message: 'Generate HTTP Controller?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'generateCli',
          message: 'Generate CLI commands?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'overwriteExisting',
          message: 'Overwrite existing feature files if they already exist?',
          default: false,
        },
        {
          type: 'input',
          name: 'fieldNames',
          message: 'Entity field names (comma-separated, e.g., title, description, price):\n  Press Enter to skip:',
          default: '',
          filter: (value) => {
            if (!value || value.trim() === '') return [];
            return value
              .split(',')
              .map((name) => name.trim())
              .filter((name) => name.length > 0);
          },
        },
        {
          type: 'confirm',
          name: 'installDependencies',
          message: 'Install required dependencies (class-validator, database adapters, etc.)?',
          default: true,
        },
      ];

      const answers = await inquirer.prompt(basePrompts);

      const fieldNames = Array.isArray(answers.fieldNames) ? answers.fieldNames : [];
      const fields = [];

      if (fieldNames.length > 0) {
        console.log('\nConfigure field types:\n');

        for (const fieldName of fieldNames) {
          const fieldAnswers = await inquirer.prompt([
            {
              type: 'list',
              name: 'type',
              message: `Type for "${fieldName}":`,
              choices: [
                { name: 'string', value: 'string' },
                { name: 'number', value: 'number' },
                { name: 'boolean', value: 'boolean' },
                { name: 'Date', value: 'Date' },
                { name: 'enum', value: 'enum' },
                { name: 'string[] (array of strings)', value: 'string[]' },
                { name: 'number[] (array of numbers)', value: 'number[]' },
                { name: 'any', value: 'any' },
                { name: 'object', value: 'object' },
              ],
              default: 'string',
            },
            {
              type: 'confirm',
              name: 'optional',
              message: `Is "${fieldName}" optional?`,
              default: false,
            },
          ]);

          fields.push({
            name: fieldName,
            type: fieldAnswers.type,
            optional: fieldAnswers.optional,
          });
        }
      }

      answers.fields = fields;
      delete answers.fieldNames;

      return answers;
    },
    actions: (data) => {
      data.name = data.featureName;
      data.entity = data.entityName || data.featureName;
      data.nameLower = coerceText(data.name).toLowerCase();
      data.entityLower = coerceText(data.entity).toLowerCase();

      const normalizedFields = (Array.isArray(data.fields) ? data.fields : [])
        .map((field) => {
          const name = coerceText(field?.name).trim();
          if (!name) return null;
          const type = coerceText(field?.type || 'string').trim() || 'string';
          const optional = Boolean(field?.optional);
          const lowerName = name.toLowerCase();
          return {
            name,
            type,
            optional,
            isEmail: lowerName === 'email',
          };
        })
        .filter(Boolean);

      data.fields = normalizedFields;

      const classValidatorImports = new Set();
      if (data.fields.length > 0) {
        classValidatorImports.add('IsString');
        classValidatorImports.add('IsNotEmpty');
      }
      if (data.fields.some((field) => field.optional)) {
        classValidatorImports.add('IsOptional');
      }
      if (data.fields.some((field) => field.isEmail)) {
        classValidatorImports.add('IsEmail');
      }

      data.classValidatorImports = Array.from(classValidatorImports).sort();

      const requiredDependencies = new Set(['class-validator', '@nestjs/mapped-types']);
      const actions = [];

      actions.push(() => {
        const appModulePath = path.join(process.cwd(), 'src/infrastructure/framework/nest/app.module.ts');
        if (!fs.existsSync(appModulePath)) {
          return 'Skipped app.module.ts import scaffolding (file not found)';
        }

        let content = fs.readFileSync(appModulePath, 'utf8');
        if (content.includes('// <plop:imports>')) {
          return 'app.module.ts already has import markers';
        }

        const importBlockMatch = content.match(/^(?:import[^\n]+\n)+/);
        if (!importBlockMatch) {
          return 'No imports section found in app.module.ts';
        }

        const importBlock = importBlockMatch[0];
        const addition = `${importBlock}// <plop:imports>\n// </plop:imports>\n`;
        content = content.replace(importBlock, addition);
        fs.writeFileSync(appModulePath, content, 'utf8');
        return 'Prepared app.module.ts for generator imports';
      });

      const trackedPaths = [];
      const registerAdd = (actionConfig) => {
        if (actionConfig && actionConfig.path) {
          trackedPaths.push(actionConfig.path);
        }
        actions.push(actionConfig);
      };

      // Ensure database types is an array
      const dbTypes = data.dbType === 'both'
        ? ['postgres', 'mongo']
        : [data.dbType];

      data.dbTypes = dbTypes;
      data.db = dbTypes;
      data.usePostgres = dbTypes.includes('postgres');
      data.useMongo = dbTypes.includes('mongo');
      if (data.usePostgres) {
        requiredDependencies.add('@nestjs/typeorm');
        requiredDependencies.add('typeorm');
      }
      if (data.useMongo) {
        requiredDependencies.add('@nestjs/mongoose');
        requiredDependencies.add('mongoose');
      }

      // Domain layer
      registerAdd({
        type: 'add',
        path: 'src/core/domain/{{paramCase featureName}}.entity.ts',
        templateFile: path.join(templatesPath, 'domain.entity.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/core/port/{{paramCase featureName}}-repository.port.ts',
        templateFile: path.join(templatesPath, 'port.repository.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/core/mapper/{{paramCase featureName}}.mapper.ts',
        templateFile: path.join(templatesPath, 'mapper.hbs'),
      });

      // Application layer - DTOs
      registerAdd({
        type: 'add',
        path: 'src/applications/dto/{{paramCase featureName}}/create-{{paramCase featureName}}.dto.ts',
        templateFile: path.join(templatesPath, 'dto.create.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/applications/dto/{{paramCase featureName}}/update-{{paramCase featureName}}.dto.ts',
        templateFile: path.join(templatesPath, 'dto.update.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/applications/dto/{{paramCase featureName}}/{{paramCase featureName}}-response.dto.ts',
        templateFile: path.join(templatesPath, 'dto.response.hbs'),
      });

      // Application layer - Use cases
      registerAdd({
        type: 'add',
        path: 'src/applications/usecase/{{paramCase featureName}}/create-{{paramCase featureName}}.usecase.ts',
        templateFile: path.join(templatesPath, 'usecase.create.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/applications/usecase/{{paramCase featureName}}/get-{{paramCase featureName}}.usecase.ts',
        templateFile: path.join(templatesPath, 'usecase.get.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/applications/usecase/{{paramCase featureName}}/update-{{paramCase featureName}}.usecase.ts',
        templateFile: path.join(templatesPath, 'usecase.update.hbs'),
      });

      registerAdd({
        type: 'add',
        path: 'src/applications/usecase/{{paramCase featureName}}/delete-{{paramCase featureName}}.usecase.ts',
        templateFile: path.join(templatesPath, 'usecase.delete.hbs'),
      });

      // Infrastructure layer - Database entities/schemas
      if (data.usePostgres) {
        registerAdd({
          type: 'add',
          path: 'src/infrastructure/db/entities/{{paramCase featureName}}.entity.ts',
          templateFile: path.join(templatesPath, 'typeorm.entity.hbs'),
        });

        registerAdd({
          type: 'add',
          path: 'src/infrastructure/repositories/typeorm-{{paramCase featureName}}.repository.ts',
          templateFile: path.join(templatesPath, 'typeorm.repository.hbs'),
        });
      }

      if (data.useMongo) {
        registerAdd({
          type: 'add',
          path: 'src/infrastructure/db/mongo/{{paramCase featureName}}.schema.ts',
          templateFile: path.join(templatesPath, 'mongo.schema.hbs'),
        });

        registerAdd({
          type: 'add',
          path: 'src/infrastructure/repositories/mongo-{{paramCase featureName}}.repository.ts',
          templateFile: path.join(templatesPath, 'mongo.repository.hbs'),
        });
      }

      // HTTP Controller
      if (data.generateController) {
        registerAdd({
          type: 'add',
          path: 'src/infrastructure/framework/nest/http/{{paramCase featureName}}.controller.ts',
          templateFile: path.join(templatesPath, 'controller.hbs'),
        });
      }

      // CLI Commands
      if (data.generateCli) {
        registerAdd({
          type: 'add',
          path: 'src/infrastructure/cli/{{paramCase featureName}}.command.ts',
          templateFile: path.join(templatesPath, 'cli.command.hbs'),
        });
      }

      // Update app.module.ts with plop markers
      actions.push({
        type: 'modify',
        path: 'src/infrastructure/framework/nest/app.module.ts',
        pattern: /(\/\/ <plop:imports>)/g,
        template: `$1\nimport { {{pascalCase featureName}}Controller } from './http/{{paramCase featureName}}.controller';
import { Create{{pascalCase featureName}}UseCase } from '../../../applications/usecase/{{paramCase featureName}}/create-{{paramCase featureName}}.usecase';
import { Get{{pascalCase featureName}}UseCase } from '../../../applications/usecase/{{paramCase featureName}}/get-{{paramCase featureName}}.usecase';
import { Update{{pascalCase featureName}}UseCase } from '../../../applications/usecase/{{paramCase featureName}}/update-{{paramCase featureName}}.usecase';
import { Delete{{pascalCase featureName}}UseCase } from '../../../applications/usecase/{{paramCase featureName}}/delete-{{paramCase featureName}}.usecase';${
          data.usePostgres
            ? `\nimport { {{pascalCase entityName}}Entity } from '../../db/entities/{{paramCase featureName}}.entity';
import { TypeOrm{{pascalCase featureName}}Repository } from '../../repositories/typeorm-{{paramCase featureName}}.repository';`
            : ''
        }${
          data.useMongo
            ? `\nimport { {{pascalCase entityName}}, {{pascalCase entityName}}Schema } from '../../db/mongo/{{paramCase featureName}}.schema';
import { Mongo{{pascalCase featureName}}Repository } from '../../repositories/mongo-{{paramCase featureName}}.repository';`
            : ''
        }`,
      });

      // Update modules section
      if (data.usePostgres) {
        actions.push({
          type: 'modify',
          path: 'src/infrastructure/framework/nest/app.module.ts',
          pattern: /(\/\/ <plop:modules>)/g,
          template: `$1\n    ...(process.env.DB_TYPE === 'postgres' || !process.env.DB_TYPE\n      ? [TypeOrmModule.forFeature([{{pascalCase entityName}}Entity])]\n      : []),`,
        });
      }

      if (data.useMongo) {
        actions.push({
          type: 'modify',
          path: 'src/infrastructure/framework/nest/app.module.ts',
          pattern: /(\/\/ <plop:modules>)/g,
          template: `$1\n    ...(process.env.DB_TYPE === 'mongo'\n      ? [MongooseModule.forFeature([{ name: {{pascalCase entityName}}.name, schema: {{pascalCase entityName}}Schema }])]\n      : []),`,
        });
      }

      // Update controllers section
      if (data.generateController) {
        actions.push({
          type: 'modify',
          path: 'src/infrastructure/framework/nest/app.module.ts',
          pattern: /(\/\/ <plop:controllers>)/g,
          template: `$1\n    {{pascalCase featureName}}Controller,`,
        });
      }

      // Update providers section
      actions.push({
        type: 'modify',
        path: 'src/infrastructure/framework/nest/app.module.ts',
        pattern: /(\/\/ <plop:providers>)/g,
        template: `$1${
          data.dbType === 'both'
            ? `\n    {\n      provide: '{{pascalCase featureName}}RepositoryPort',\n      useClass: process.env.DB_TYPE === 'mongo'\n        ? Mongo{{pascalCase featureName}}Repository\n        : TypeOrm{{pascalCase featureName}}Repository,\n    },`
            : data.dbType === 'mongo'
            ? `\n    {\n      provide: '{{pascalCase featureName}}RepositoryPort',\n      useClass: Mongo{{pascalCase featureName}}Repository,\n    },`
            : `\n    {\n      provide: '{{pascalCase featureName}}RepositoryPort',\n      useClass: TypeOrm{{pascalCase featureName}}Repository,\n    },`
        }
    Create{{pascalCase featureName}}UseCase,
    Get{{pascalCase featureName}}UseCase,
    Update{{pascalCase featureName}}UseCase,
    Delete{{pascalCase featureName}}UseCase,`,
      });

      if (data.usePostgres) {
        actions.push(() => {
          const appModulePath = path.join(process.cwd(), 'src/infrastructure/framework/nest/app.module.ts');
          if (!fs.existsSync(appModulePath)) {
            return 'Skipped TypeOrmModule import (app.module.ts missing)';
          }

          const importLine = "import { TypeOrmModule } from '@nestjs/typeorm';";
          let content = fs.readFileSync(appModulePath, 'utf8');
          if (content.includes(importLine)) {
            return 'TypeOrmModule import already present';
          }

          content = content.replace('// <plop:imports>', `// <plop:imports>\n${importLine}`);
          fs.writeFileSync(appModulePath, content, 'utf8');
          return 'Added TypeOrmModule import to app.module.ts';
        });
      }

      if (data.useMongo) {
        actions.push(() => {
          const appModulePath = path.join(process.cwd(), 'src/infrastructure/framework/nest/app.module.ts');
          if (!fs.existsSync(appModulePath)) {
            return 'Skipped MongooseModule import (app.module.ts missing)';
          }

          const importLine = "import { MongooseModule } from '@nestjs/mongoose';";
          let content = fs.readFileSync(appModulePath, 'utf8');
          if (content.includes(importLine)) {
            return 'MongooseModule import already present';
          }

          content = content.replace('// <plop:imports>', `// <plop:imports>\n${importLine}`);
          fs.writeFileSync(appModulePath, content, 'utf8');
          return 'Added MongooseModule import to app.module.ts';
        });
      }

      if (data.overwriteExisting) {
        actions.unshift(() => {
          const basePath = process.cwd();
          const resolvedPaths = new Set(
            trackedPaths.map((templatePath) => {
              const renderedPath = plop.renderString(templatePath, data);
              return path.join(basePath, renderedPath);
            })
          );

          const removed = [];
          for (const filePath of resolvedPaths) {
            try {
              if (!fs.existsSync(filePath)) {
                continue;
              }

              const stats = fs.lstatSync(filePath);
              if (stats.isDirectory()) {
                continue;
              }

              if (typeof fs.rmSync === 'function') {
                fs.rmSync(filePath, { force: true });
              } else {
                fs.unlinkSync(filePath);
              }
              removed.push(filePath);
            } catch (error) {
              throw new Error(`Failed to remove existing files: ${error.message}`);
            }
          }

          const appModulePath = path.join(basePath, 'src/infrastructure/framework/nest/app.module.ts');
          if (fs.existsSync(appModulePath)) {
            const pascalName = toPascalCase(data.name);
            const entityPascal = toPascalCase(data.entity);
            const paramName = toParamCase(data.name);

            let appModuleContent = fs.readFileSync(appModulePath, 'utf8');

            const importLinesToRemove = [
              `import { ${pascalName}Controller } from './http/${paramName}.controller';`,
              `import { Create${pascalName}UseCase } from '../../../applications/usecase/${paramName}/create-${paramName}.usecase';`,
              `import { Get${pascalName}UseCase } from '../../../applications/usecase/${paramName}/get-${paramName}.usecase';`,
              `import { Update${pascalName}UseCase } from '../../../applications/usecase/${paramName}/update-${paramName}.usecase';`,
              `import { Delete${pascalName}UseCase } from '../../../applications/usecase/${paramName}/delete-${paramName}.usecase';`,
              `import { ${entityPascal}Entity } from '../../db/entities/${paramName}.entity';`,
              `import { ${entityPascal}, ${entityPascal}Schema } from '../../db/mongo/${paramName}.schema';`,
              `import { TypeOrm${pascalName}Repository } from '../../repositories/typeorm-${paramName}.repository';`,
              `import { Mongo${pascalName}Repository } from '../../repositories/mongo-${paramName}.repository';`,
            ];

            importLinesToRemove.forEach((line) => {
              appModuleContent = appModuleContent.replace(`${line}\n`, '\n');
            });

            const lines = appModuleContent.split('\n');
            const cleanedLines = [];

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              if (line.includes(`${pascalName}Controller`)) continue;
              if (line.includes(`Create${pascalName}UseCase`)) continue;
              if (line.includes(`Get${pascalName}UseCase`)) continue;
              if (line.includes(`Update${pascalName}UseCase`)) continue;
              if (line.includes(`Delete${pascalName}UseCase`)) continue;
              if (line.includes(`${pascalName}RepositoryPort`)) continue;
              if (line.includes(`Mongo${pascalName}Repository`)) continue;
              if (line.includes(`TypeOrm${pascalName}Repository`)) continue;
              if (line.includes(`${entityPascal}Entity } from '../../db/entities/${paramName}.entity'`)) continue;
              if (line.includes(`${entityPascal}, ${entityPascal}Schema } from '../../db/mongo/${paramName}.schema'`)) continue;

              if (line.includes(`...(process.env.DB_TYPE === 'postgres'`) && lines[i + 1]?.includes(`TypeOrmModule.forFeature([${entityPascal}Entity])`)) {
                i += 2;
                continue;
              }

              if (line.includes(`...(process.env.DB_TYPE === 'mongo'`) && lines[i + 1]?.includes(`${entityPascal}.name`)) {
                i += 2;
                continue;
              }

              if (line.trim() === '{' && lines[i + 1]?.includes(`provide: '${pascalName}RepositoryPort'`)) {
                while (i < lines.length && !lines[i].trim().endsWith('},')) {
                  i++;
                }
                continue;
              }

              cleanedLines.push(line);
            }

            appModuleContent = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');

            fs.writeFileSync(appModulePath, appModuleContent, 'utf8');
          }

          if (removed.length > 0) {
            const label = removed.length === 1 ? 'file' : 'files';
            return `Removed ${removed.length} existing ${label} before generation`;
          }
          return 'No existing files required removal';
        });
      }

      actions.push(() => {
        if (!data.installDependencies) {
          return 'Skipped dependency installation (user choice)';
        }

        const cwd = process.cwd();
        const pkgJson = readPackageJson(cwd);
        if (!pkgJson) {
          return 'package.json not found - skipped dependency installation';
        }

        const missingDeps = Array.from(requiredDependencies).filter((dep) => !hasDependency(pkgJson, dep));
        if (missingDeps.length === 0) {
          return 'All required dependencies already installed';
        }

        const packageManager = detectPackageManager(cwd);
        const commandTuple = serializeDependencyCommand(missingDeps, packageManager);
        if (!commandTuple) {
          return 'No dependencies to install';
        }

        const [command, args] = commandTuple;
        const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
        if (result.status !== 0) {
          throw new Error(`Failed to install dependencies: ${missingDeps.join(', ')}`);
        }

        return `Installed dependencies with ${packageManager}: ${missingDeps.join(', ')}`;
      });

      return actions;
    },
  });
};
