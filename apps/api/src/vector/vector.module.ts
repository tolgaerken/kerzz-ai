import { Module, Global } from '@nestjs/common';
import { VectorService } from './vector.service';
import { PromptsModule } from '../prompts/prompts.module';

@Global()
@Module({
  imports: [PromptsModule],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}
