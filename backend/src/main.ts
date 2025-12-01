import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './infrastructure/framework/nest/app.module';
import { AiStandaloneModule } from './infrastructure/framework/nest/ai-standalone.module';
import { AllExceptionsFilter } from './infrastructure/framework/nest/filters/all-exceptions.filter';

/**
 * Point d'entrée principal de l'application
 * Charge tous les modules (CRM + AI) si DB_TYPE=postgres
 * Charge uniquement le module AI si DB_TYPE=none
 * Pour démarrer: npm run start:dev
 */

// Force UTF-8 encoding for Node.js on Windows
if (process.platform === 'win32') {
  process.env.NODE_OPTIONS = '--input-type=module';
  // Set default encoding
  if (process.stdout.setEncoding) {
    process.stdout.setEncoding('utf8');
  }
  if (process.stderr.setEncoding) {
    process.stderr.setEncoding('utf8');
  }
}

async function bootstrap() {
  const dbType = process.env.DB_TYPE || 'postgres';
  const useFullApp = dbType === 'postgres';

  // Choose module based on DB_TYPE
  const AppModuleToUse = useFullApp ? AppModule : AiStandaloneModule;
  const app = await NestFactory.create(AppModuleToUse);

  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ['http://localhost:3000'];

  // Allow requests from configured front-end origins
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // Activer la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les champs non définis dans le DTO
      forbidNonWhitelisted: true, // Rejette si des champs inconnus sont envoyés
      transform: true, // Transforme automatiquement les types
    }),
  );

  // Activer le filtre d'exceptions global
  app.useGlobalFilters(new AllExceptionsFilter());

  // Setup Swagger only for full app
  if (useFullApp) {
    const config = new DocumentBuilder()
      .setTitle('Backend API')
      .setDescription('API documentation generated with NestJS Swagger')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Startup banner
  const dbStatus =
    dbType === 'none'
      ? 'Disabled'
      : `${dbType.toUpperCase()} (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'})`;

  if (useFullApp) {
    console.log(`
╔═══════════════════════════════════════════════╗
║          🚀 Application Started (Full)        ║
╠═══════════════════════════════════════════════╣
║   Server:     http://localhost:${port}           ║
║   Swagger:    http://localhost:${port}/docs      ║
║   Database:   ${dbStatus.padEnd(30)} ║
║   AI Module:  Enabled                         ║
║   LLM gRPC:   ${(process.env.LLM_GRPC_ADDR || 'localhost:50051').padEnd(30)} ║
╠═══════════════════════════════════════════════╣
║   AI Endpoints:                               ║
║   GET /ai/generate-once?q=<prompt>           ║
║   GET /ai/generate?q=<prompt> (SSE)          ║
║                                               ║
║   CRM Endpoints: /docs for full list         ║
╚═══════════════════════════════════════════════╝
    `);
  } else {
    console.log(`
╔═══════════════════════════════════════════════╗
║     🤖 Application Started (AI Only)          ║
╠═══════════════════════════════════════════════╣
║   Server:     http://localhost:${port}           ║
║   Database:   ${dbStatus.padEnd(30)} ║
║   LLM gRPC:   ${(process.env.LLM_GRPC_ADDR || 'localhost:50051').padEnd(30)} ║
╠═══════════════════════════════════════════════╣
║   Endpoints:                                  ║
║   GET /ai/generate-once?q=<prompt>           ║
║   GET /ai/generate?q=<prompt> (SSE)          ║
╚═══════════════════════════════════════════════╝
    `);
  }
}

bootstrap();
