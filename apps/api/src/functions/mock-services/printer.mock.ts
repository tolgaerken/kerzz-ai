/**
 * Printer Mock Service
 * Yazıcı işlemleri için mock implementasyon
 */

export interface PrinterStatusParams {
  printer_type?: 'fis' | 'mutfak' | 'bar' | 'rapor' | 'all';
  printer_id?: string;
}

export interface TestPrintParams {
  printer_type: 'fis' | 'mutfak' | 'bar' | 'rapor';
  printer_id?: string;
}

export interface PrinterSettingParams {
  printer_type: 'fis' | 'mutfak' | 'bar' | 'rapor';
  setting: 'paper_width' | 'auto_cut' | 'font_size' | 'enabled' | 'default';
  value: string;
}

export interface PrinterInfo {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  paperStatus: 'ok' | 'low' | 'empty';
  lastPrint: string;
  ip?: string;
  model: string;
}

export class PrinterMockService {
  // Mock yazıcı verileri
  private printers: PrinterInfo[] = [
    {
      id: 'PRT-001',
      name: 'Fiş Yazıcısı 1',
      type: 'fis',
      status: 'online',
      paperStatus: 'ok',
      lastPrint: new Date(Date.now() - 5 * 60000).toISOString(),
      ip: '192.168.1.100',
      model: 'Epson TM-T88VI',
    },
    {
      id: 'PRT-002',
      name: 'Mutfak Yazıcısı',
      type: 'mutfak',
      status: 'online',
      paperStatus: 'low',
      lastPrint: new Date(Date.now() - 2 * 60000).toISOString(),
      ip: '192.168.1.101',
      model: 'Star TSP143',
    },
    {
      id: 'PRT-003',
      name: 'Bar Yazıcısı',
      type: 'bar',
      status: 'online',
      paperStatus: 'ok',
      lastPrint: new Date(Date.now() - 10 * 60000).toISOString(),
      ip: '192.168.1.102',
      model: 'Epson TM-T20III',
    },
    {
      id: 'PRT-004',
      name: 'Rapor Yazıcısı',
      type: 'rapor',
      status: 'offline',
      paperStatus: 'ok',
      lastPrint: new Date(Date.now() - 60 * 60000).toISOString(),
      ip: '192.168.1.103',
      model: 'HP LaserJet Pro',
    },
  ];

  getStatus(params: PrinterStatusParams) {
    let printers = this.printers;

    if (params.printer_id) {
      printers = printers.filter(p => p.id === params.printer_id);
    } else if (params.printer_type && params.printer_type !== 'all') {
      printers = printers.filter(p => p.type === params.printer_type);
    }

    if (printers.length === 0) {
      return {
        success: false,
        message: 'Belirtilen yazıcı bulunamadı.',
        printers: [],
      };
    }

    const statusSummary = printers.map(p => ({
      ...p,
      statusText: this.getStatusText(p),
    }));

    const hasIssue = printers.some(p => p.status !== 'online' || p.paperStatus !== 'ok');

    return {
      success: true,
      message: hasIssue
        ? 'Bazı yazıcılarda sorun tespit edildi.'
        : 'Tüm yazıcılar normal çalışıyor.',
      printers: statusSummary,
      summary: {
        total: printers.length,
        online: printers.filter(p => p.status === 'online').length,
        offline: printers.filter(p => p.status === 'offline').length,
        paperLow: printers.filter(p => p.paperStatus === 'low').length,
      },
    };
  }

  sendTestPrint(params: TestPrintParams) {
    const printer = this.printers.find(
      p => p.type === params.printer_type || p.id === params.printer_id
    );

    if (!printer) {
      return {
        success: false,
        message: `${params.printer_type} yazıcısı bulunamadı.`,
      };
    }

    if (printer.status === 'offline') {
      return {
        success: false,
        message: `${printer.name} şu anda çevrimdışı. Lütfen yazıcının açık olduğundan emin olun.`,
        printer: printer.name,
      };
    }

    console.log(`🖨️ Test çıktısı gönderildi: ${printer.name}`);

    return {
      success: true,
      message: `Test çıktısı ${printer.name} yazıcısına gönderildi.`,
      printer: printer.name,
      printerId: printer.id,
      timestamp: new Date().toISOString(),
    };
  }

  updateSetting(params: PrinterSettingParams) {
    const printer = this.printers.find(p => p.type === params.printer_type);

    if (!printer) {
      return {
        success: false,
        message: `${params.printer_type} yazıcısı bulunamadı.`,
      };
    }

    const settingNames = {
      paper_width: 'Kağıt genişliği',
      auto_cut: 'Otomatik kesim',
      font_size: 'Font boyutu',
      enabled: 'Aktiflik durumu',
      default: 'Varsayılan yazıcı',
    };

    console.log(`⚙️ Yazıcı ayarı güncellendi: ${printer.name} - ${params.setting}: ${params.value}`);

    return {
      success: true,
      message: `${printer.name} için ${settingNames[params.setting]} ayarı "${params.value}" olarak güncellendi.`,
      printer: printer.name,
      setting: params.setting,
      newValue: params.value,
    };
  }

  private getStatusText(printer: PrinterInfo): string {
    if (printer.status === 'offline') {
      return '🔴 Çevrimdışı';
    }
    if (printer.status === 'error') {
      return '⚠️ Hata';
    }
    if (printer.paperStatus === 'low') {
      return '🟡 Çevrimiçi (kağıt azalıyor)';
    }
    if (printer.paperStatus === 'empty') {
      return '🔴 Kağıt bitti';
    }
    return '🟢 Çevrimiçi';
  }
}
