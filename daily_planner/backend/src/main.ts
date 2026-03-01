import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { BigIntInterceptor } from "./common/interceptors/bigint.interceptor";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS для фронта
  app.enableCors({ origin: true, credentials: true });

  // статика для будущих аватарок
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });

  // валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // BigInt -> string
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  app.useGlobalInterceptors(new BigIntInterceptor());

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`🚀 Listening on http://localhost:${port}`);
}

bootstrap();