import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  const config = new DocumentBuilder()
    .setTitle('Kerzz AI API')
    .setDescription('Kerzz Support Chatbot & Document Management API')
    .setVersion('1.0')
    .addTag('documents')
    .addTag('chat')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(3001);
  console.log('🚀 API running at http://localhost:3001');
  console.log('📚 Swagger docs at http://localhost:3001/api');
}
bootstrap();
