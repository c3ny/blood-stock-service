import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Inicializa a aplicação NestJS, configura validação global,
 * CORS, documentação Swagger e inicia o servidor HTTP.
 */
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

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blood Stock Service API')
    .setDescription('Migrated API with backward-compatible contracts')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/swagger-ui/index.html', app, document);

  const port = Number(process.env.PORT ?? 8081);
  await app.listen(port);
}

void bootstrap();