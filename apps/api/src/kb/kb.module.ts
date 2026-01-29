import { Module } from '@nestjs/common';
import { KBService } from './kb.service';
import { KBController } from './kb.controller';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [VectorModule],
  controllers: [KBController],
  providers: [KBService],
  exports: [KBService],
})
export class KBModule {}
