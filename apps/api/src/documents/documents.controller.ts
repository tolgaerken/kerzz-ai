import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';

class AddDocumentDto {
  text: string;
  category?: string;
  product?: string;
  tags?: string[];
}

class BulkAddDto {
  documents: Array<{ text: string; metadata?: Record<string, any> }>;
}

class AddQADto {
  question: string;
  customerAnswer: string;
  technicianAnswer: string;
  category?: string;
  tags?: string[];
}

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a single document' })
  async addDocument(@Body() dto: AddDocumentDto) {
    const { text, ...metadata } = dto;
    return this.documentsService.addDocument(text, metadata);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Add multiple documents' })
  async addBulkDocuments(@Body() dto: BulkAddDto) {
    return this.documentsService.addBulkDocuments(dto.documents);
  }

  @Post('qa')
  @ApiOperation({ summary: 'Add a question-answer pair' })
  async addQA(@Body() dto: AddQADto) {
    return this.documentsService.addQA(
      dto.question, 
      dto.customerAnswer, 
      dto.technicianAnswer,
      {
        category: dto.category,
        tags: dto.tags,
      }
    );
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload and parse a file (txt, md, pdf)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.documentsService.parseAndAddFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all documents' })
  async listDocuments(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.documentsService.listDocuments(limit || 100, offset || 0);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document by ID' })
  async deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update a document by ID' })
  async updateDocument(@Param('id') id: string, @Body() dto: AddDocumentDto) {
    const { text, ...metadata } = dto;
    return this.documentsService.updateDocument(id, text, metadata);
  }

  @Post(':id/qa')
  @ApiOperation({ summary: 'Update a QA document by ID' })
  async updateQA(@Param('id') id: string, @Body() dto: AddQADto) {
    return this.documentsService.updateQA(
      id,
      dto.question,
      dto.customerAnswer,
      dto.technicianAnswer,
      {
        category: dto.category,
        tags: dto.tags,
      }
    );
  }
}
