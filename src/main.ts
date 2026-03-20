import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (validationErrors = []) => {
        const errors = validationErrors.flatMap((validationError) => {
          const constraints = validationError.constraints ?? {};
          return Object.values(constraints).map(
            (message) => `${validationError.property}: ${message}`,
          );
        });
        return new BadRequestException(errors);
      },
    }),
  );

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Swagger + Scalar
  const config = new DocumentBuilder()
    .setTitle('Blood Stock Service')
    .setDescription('API de gerenciamento de estoque de sangue — Sangue Solidário')
    .setVersion('0.1.2')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI (fallback) + JSON spec
  SwaggerModule.setup('api-docs', app, document);

  // Scalar UI
  app.use(
    '/docs',
    apiReference({
      spec: { content: document },
      theme: 'kepler',
    }),
  );

  const port = process.env.PORT ?? 3004;
  await app.listen(port);

  console.log(`🚀 Blood Stock Service running on: http://localhost:${port}`);
  console.log(`📚 API Docs (Scalar): http://localhost:${port}/docs`);
  console.log(`📋 Swagger JSON: http://localhost:${port}/api-docs-json`);
}

void bootstrap();