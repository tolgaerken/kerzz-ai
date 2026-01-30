/**
 * Function Calling Tool Tanımları
 * OpenAI tools formatında fonksiyon tanımları
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  // Ticket İşlemleri
  {
    type: 'function',
    function: {
      name: 'create_ticket',
      description: 'Müşteri için destek talebi/ticket oluşturur. Sorun çözülemediğinde veya teknik destek gerektiğinde kullan.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Ticket başlığı (kısa ve öz)',
          },
          description: {
            type: 'string',
            description: 'Sorunun detaylı açıklaması',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Öncelik seviyesi',
          },
          category: {
            type: 'string',
            enum: ['printer', 'pos', 'network', 'payment', 'order', 'other'],
            description: 'Sorun kategorisi',
          },
        },
        required: ['title', 'description'],
      },
    },
  },

  // Yazıcı İşlemleri
  {
    type: 'function',
    function: {
      name: 'get_printer_status',
      description: 'Yazıcının mevcut durumunu sorgular (online/offline, kağıt durumu, hata var mı).',
      parameters: {
        type: 'object',
        properties: {
          printer_type: {
            type: 'string',
            enum: ['fis', 'mutfak', 'bar', 'rapor', 'all'],
            description: 'Yazıcı tipi',
          },
          printer_id: {
            type: 'string',
            description: 'Spesifik yazıcı ID (opsiyonel)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_test_print',
      description: 'Belirtilen yazıcıya test çıktısı gönderir.',
      parameters: {
        type: 'object',
        properties: {
          printer_type: {
            type: 'string',
            enum: ['fis', 'mutfak', 'bar', 'rapor'],
            description: 'Yazıcı tipi',
          },
          printer_id: {
            type: 'string',
            description: 'Spesifik yazıcı ID (opsiyonel)',
          },
        },
        required: ['printer_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_printer_setting',
      description: 'Yazıcı ayarını değiştirir.',
      parameters: {
        type: 'object',
        properties: {
          printer_type: {
            type: 'string',
            enum: ['fis', 'mutfak', 'bar', 'rapor'],
            description: 'Yazıcı tipi',
          },
          setting: {
            type: 'string',
            enum: ['paper_width', 'auto_cut', 'font_size', 'enabled', 'default'],
            description: 'Değiştirilecek ayar',
          },
          value: {
            type: 'string',
            description: 'Yeni değer',
          },
        },
        required: ['printer_type', 'setting', 'value'],
      },
    },
  },

  // Sipariş İşlemleri
  {
    type: 'function',
    function: {
      name: 'get_order_info',
      description: 'Sipariş bilgilerini getirir.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'Sipariş numarası',
          },
          table_number: {
            type: 'string',
            description: 'Masa numarası (sipariş ID yoksa)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_order',
      description: 'Siparişi iptal eder.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'Sipariş numarası',
          },
          reason: {
            type: 'string',
            description: 'İptal nedeni',
          },
        },
        required: ['order_id', 'reason'],
      },
    },
  },

  // Eskalasyon
  {
    type: 'function',
    function: {
      name: 'escalate_to_tech',
      description: 'Sorunu teknik destek ekibine yönlendirir.',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: {
            type: 'string',
            description: 'Mevcut ticket ID (varsa)',
          },
          reason: {
            type: 'string',
            description: 'Eskalasyon nedeni',
          },
          urgency: {
            type: 'string',
            enum: ['normal', 'urgent', 'critical'],
            description: 'Aciliyet seviyesi',
          },
          contact_info: {
            type: 'string',
            description: 'Müşteri iletişim bilgisi',
          },
        },
        required: ['reason', 'urgency'],
      },
    },
  },
];

// Fonksiyon isimlerini kolayca erişmek için
export const FUNCTION_NAMES = AVAILABLE_TOOLS.map(t => t.function.name);

// Fonksiyon açıklamalarını prompt'a eklemek için
export function getToolDescriptionsForPrompt(): string {
  return AVAILABLE_TOOLS.map(t => 
    `- ${t.function.name}: ${t.function.description}`
  ).join('\n');
}
