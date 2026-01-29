import { Controller, Post, Body, Query, Get, Res, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { Observable } from 'rxjs';

class ChatDto {
  query: string;
  mode?: 'customer' | 'technician';
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to the chatbot' })
  async chat(@Body() dto: ChatDto) {
    return this.chatService.chat(dto.query, dto.mode || 'customer', dto.history || []);
  }

  @Post('stream')
  @ApiOperation({ summary: 'Stream chat response (SSE)' })
  async chatStream(@Body() dto: ChatDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.chatService.chatStream(
        dto.query,
        dto.mode || 'customer',
        dto.history || [],
      );

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search documents without generating response' })
  async search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.chatService.search(query, limit || 5);
  }
}
