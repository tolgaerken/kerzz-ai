import { Injectable } from '@nestjs/common';
import { VectorService } from '../vector/vector.service';

@Injectable()
export class ChatService {
  constructor(private vector: VectorService) {}

  async chat(
    query: string, 
    mode: 'customer' | 'technician' = 'customer',
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ) {
    return this.vector.chat(query, mode, history);
  }

  async chatStream(
    query: string,
    mode: 'customer' | 'technician' = 'customer',
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ) {
    return this.vector.chatStream(query, mode, history);
  }

  async search(query: string, limit = 5) {
    return this.vector.search(query, limit);
  }
}
