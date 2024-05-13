import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

async function bootstrap() {
  const port = process.env.PORT || 3000;

  const app = await NestFactory.create(AppModule);

  // use logger
  app.useLogger(app.get(Logger));

  const configService = app.get<ConfigService>(ConfigService);

  const APP_FRONTEND_DOMAIN = configService.get('APP_FRONT_END_DOMAIN');

  const whitelistDomain =
    APP_FRONTEND_DOMAIN == '*' ? '*' : APP_FRONTEND_DOMAIN.split(',');

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableCors({
    origin: whitelistDomain,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Public Folder
  app.use('/public', express.static(join(__dirname, '..', 'public')));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.use(helmet({ crossOriginResourcePolicy: false }));

  await app.listen(port);
}
bootstrap();
