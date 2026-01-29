import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';

class UpdatePromptsDto {
  customer?: string;
  technician?: string;
}

@ApiTags('prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private promptsService: PromptsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current system prompts' })
  async getPrompts() {
    return this.promptsService.getPrompts();
  }

  @Post()
  @ApiOperation({ summary: 'Update system prompts' })
  async updatePrompts(@Body() dto: UpdatePromptsDto) {
    return this.promptsService.updatePrompts(dto);
  }
}
