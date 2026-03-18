import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
    origin: [ 'http://localhost:3004',  '0.0.0.0' ],
    credentials: true,
  });

  await app.listen((process.env.PORT ?? 3004));

  console.log(
    `🚀 Blood Stock Service running on: http://localhost:${process.env.PORT ?? 3004}`,
  );
  
}

void bootstrap();