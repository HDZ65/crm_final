import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Body size limit (1MB)
  app.use(json({ limit: '1mb' }));

  // Disable CORS (backend-to-backend only)
  app.enableCors({ origin: true, credentials: true });

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('CRM Gateway API')
    .setDescription('External REST ingress for the CRM — receives contract webhooks from WinLead+ and future integrations')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const httpPort = process.env.HTTP_PORT || 3405;
  await app.listen(httpPort);

  const logger = new Logger('Bootstrap');
  logger.log('========================================');
  logger.log('SERVICE-GATEWAY STARTED');
  logger.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  logger.log('Endpoints: POST /api/winleadplus, GET /health');
  logger.log('========================================');
}

bootstrap();
