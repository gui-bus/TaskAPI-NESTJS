import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

// ? THIS IS THE MAIN FILE THAT RUNS THE APP
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
