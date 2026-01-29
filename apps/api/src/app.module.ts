import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { VectorModule } from './vector/vector.module';
import { PromptsModule } from './prompts/prompts.module';
import { KBModule } from './kb/kb.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VectorModule,
    DocumentsModule,
    ChatModule,
    PromptsModule,
    KBModule,
  ],
})
export class AppModule {}
