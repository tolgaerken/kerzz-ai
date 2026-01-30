/**
 * Ticket Mock Service
 * Destek talebi işlemleri için mock implementasyon
 */

export interface CreateTicketParams {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'printer' | 'pos' | 'network' | 'payment' | 'order' | 'other';
}

export interface TicketResult {
  success: boolean;
  ticketId: string;
  message: string;
  estimatedResponse: string;
  priority: string;
  category: string;
}

export class TicketMockService {
  private ticketCounter = 1000;

  create(params: CreateTicketParams): TicketResult {
    const ticketId = `TKT-${++this.ticketCounter}`;
    const priority = params.priority || 'medium';
    const category = params.category || 'other';

    // Önceliğe göre tahmini yanıt süresi
    const responseTimeMap = {
      critical: '30 dakika içinde',
      high: '1 saat içinde',
      medium: '2-4 saat içinde',
      low: '24 saat içinde',
    };

    console.log(`📝 Ticket oluşturuldu: ${ticketId} - ${params.title}`);

    return {
      success: true,
      ticketId,
      message: `Destek talebiniz oluşturuldu. Ticket numaranız: ${ticketId}`,
      estimatedResponse: responseTimeMap[priority],
      priority,
      category,
    };
  }

  getStatus(ticketId: string) {
    // Mock status
    const statuses = ['open', 'in_progress', 'waiting_customer', 'resolved'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      success: true,
      ticketId,
      status: randomStatus,
      lastUpdate: new Date().toISOString(),
      assignedTo: 'Teknik Destek Ekibi',
    };
  }
}
