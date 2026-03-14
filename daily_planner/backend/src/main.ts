import "dotenv/config";
import * as express from "express";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";
import { BigIntInterceptor } from "./common/interceptors/bigint.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  // Body limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Static uploads
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });

  // Validation
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