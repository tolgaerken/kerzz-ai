/**
 * Escalation Mock Service
 * Teknik ekibe yönlendirme işlemleri için mock implementasyon
 */

export interface EscalateParams {
  ticket_id?: string;
  reason: string;
  urgency: 'normal' | 'urgent' | 'critical';
  contact_info?: string;
}

export interface EscalationResult {
  success: boolean;
  escalationId: string;
  message: string;
  assignedTeam: string;
  expectedCallback: string;
  ticketId?: string;
}

export class EscalationMockService {
  private escalationCounter = 100;

  escalate(params: EscalateParams): EscalationResult {
    const escalationId = `ESC-${++this.escalationCounter}`;

    // Aciliyete göre atanan ekip ve beklenen geri dönüş
    const teamMap = {
      critical: {
        team: 'Acil Müdahale Ekibi',
        callback: '15 dakika içinde',
      },
      urgent: {
        team: 'Öncelikli Destek Ekibi',
        callback: '1 saat içinde',
      },
      normal: {
        team: 'Teknik Destek Ekibi',
        callback: '4 saat içinde',
      },
    };

    const assignment = teamMap[params.urgency];

    console.log(`🚨 Eskalasyon oluşturuldu: ${escalationId} - ${params.reason} (${params.urgency})`);

    return {
      success: true,
      escalationId,
      message: `Talebiniz ${assignment.team}'ne iletildi. ${assignment.callback} size geri dönüş yapılacaktır.`,
      assignedTeam: assignment.team,
      expectedCallback: assignment.callback,
      ticketId: params.ticket_id,
    };
  }
}
