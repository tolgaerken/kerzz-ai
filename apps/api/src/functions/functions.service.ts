import { Injectable } from '@nestjs/common';
import {
  TicketMockService,
  PrinterMockService,
  OrderMockService,
  EscalationMockService,
} from './mock-services';
import { FUNCTION_NAMES } from './function-definitions';

export interface FunctionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class FunctionsService {
  private ticketService = new TicketMockService();
  private printerService = new PrinterMockService();
  private orderService = new OrderMockService();
  private escalationService = new EscalationMockService();

  /**
   * Fonksiyon çağrısını execute eder
   */
  async execute(functionName: string, args: Record<string, any>): Promise<FunctionResult> {
    console.log(`🔧 Function call: ${functionName}`, args);

    try {
      switch (functionName) {
        // Ticket işlemleri
        case 'create_ticket':
          return this.wrapResult(this.ticketService.create(args as any));

        // Yazıcı işlemleri
        case 'get_printer_status':
          return this.wrapResult(this.printerService.getStatus(args as any));

        case 'send_test_print':
          return this.wrapResult(this.printerService.sendTestPrint(args as any));

        case 'update_printer_setting':
          return this.wrapResult(this.printerService.updateSetting(args as any));

        // Sipariş işlemleri
        case 'get_order_info':
          return this.wrapResult(this.orderService.getInfo(args as any));

        case 'cancel_order':
          return this.wrapResult(this.orderService.cancel(args as any));

        // Eskalasyon
        case 'escalate_to_tech':
          return this.wrapResult(this.escalationService.escalate(args as any));

        default:
          return {
            success: false,
            message: `Bilinmeyen fonksiyon: ${functionName}`,
          };
      }
    } catch (error) {
      console.error(`❌ Function error (${functionName}):`, error);
      return {
        success: false,
        message: `Fonksiyon çalıştırılırken hata oluştu: ${error.message}`,
      };
    }
  }

  /**
   * Fonksiyon isminin geçerli olup olmadığını kontrol eder
   */
  isValidFunction(name: string): boolean {
    return FUNCTION_NAMES.includes(name);
  }

  /**
   * Mock servis sonucunu standart formata çevirir
   */
  private wrapResult(result: any): FunctionResult {
    return {
      success: result.success ?? true,
      message: result.message || 'İşlem tamamlandı',
      data: result,
    };
  }
}
