import { Module, Global } from '@nestjs/common';
import { VectorService } from './vector.service';
import { PromptsModule } from '../prompts/prompts.module';
import { FunctionsModule } from '../functions/functions.module';

@Global()
@Module({
  imports: [PromptsModule, FunctionsModule],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}
