import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PromptsService {
  // Use absolute path from project root
  private promptsPath = path.join(process.cwd(), 'prompts/system-prompts.json');

  getPrompts() {
    try {
      const data = fs.readFileSync(this.promptsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return defaults if file doesn't exist
      return {
        customer: 'Default customer prompt',
        technician: 'Default technician prompt',
      };
    }
  }

  updatePrompts(updates: { customer?: string; technician?: string }) {
    const current = this.getPrompts();
    const updated = {
      customer: updates.customer ?? current.customer,
      technician: updates.technician ?? current.technician,
    };

    fs.writeFileSync(this.promptsPath, JSON.stringify(updated, null, 2), 'utf-8');
    return { success: true, prompts: updated };
  }
}
