import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';

// ? THIS IS THE MAIN FILE THAT RUNS THE APP
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove fields that are not in the DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
