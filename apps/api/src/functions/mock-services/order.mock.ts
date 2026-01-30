/**
 * Order Mock Service
 * Sipariş işlemleri için mock implementasyon
 */

export interface GetOrderParams {
  order_id?: string;
  table_number?: string;
}

export interface CancelOrderParams {
  order_id: string;
  reason: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderInfo {
  orderId: string;
  tableNumber: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  items: OrderItem[];
  total: number;
  createdAt: string;
  waiter: string;
}

export class OrderMockService {
  // Mock sipariş verileri
  private orders: OrderInfo[] = [
    {
      orderId: 'ORD-5001',
      tableNumber: '5',
      status: 'preparing',
      items: [
        { name: 'Adana Kebap', quantity: 2, price: 180 },
        { name: 'Ayran', quantity: 2, price: 25 },
        { name: 'Künefe', quantity: 1, price: 90 },
      ],
      total: 500,
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      waiter: 'Ahmet',
    },
    {
      orderId: 'ORD-5002',
      tableNumber: '8',
      status: 'pending',
      items: [
        { name: 'Lahmacun', quantity: 4, price: 60 },
        { name: 'Kola', quantity: 4, price: 30 },
      ],
      total: 360,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      waiter: 'Mehmet',
    },
    {
      orderId: 'ORD-5003',
      tableNumber: '12',
      status: 'served',
      items: [
        { name: 'Izgara Köfte', quantity: 3, price: 150 },
        { name: 'Salata', quantity: 2, price: 45 },
        { name: 'Su', quantity: 5, price: 10 },
      ],
      total: 590,
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      waiter: 'Ali',
    },
  ];

  getInfo(params: GetOrderParams) {
    let order: OrderInfo | undefined;

    if (params.order_id) {
      order = this.orders.find(o => o.orderId === params.order_id);
    } else if (params.table_number) {
      order = this.orders.find(o => o.tableNumber === params.table_number && o.status !== 'paid' && o.status !== 'cancelled');
    }

    if (!order) {
      return {
        success: false,
        message: params.order_id 
          ? `${params.order_id} numaralı sipariş bulunamadı.`
          : `${params.table_number} numaralı masada aktif sipariş bulunamadı.`,
      };
    }

    const statusText = this.getStatusText(order.status);

    return {
      success: true,
      order: {
        ...order,
        statusText,
        itemsSummary: order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      },
      message: `Sipariş bulundu: ${order.orderId} - Masa ${order.tableNumber}`,
    };
  }

  cancel(params: CancelOrderParams) {
    const order = this.orders.find(o => o.orderId === params.order_id);

    if (!order) {
      return {
        success: false,
        message: `${params.order_id} numaralı sipariş bulunamadı.`,
      };
    }

    if (order.status === 'paid') {
      return {
        success: false,
        message: 'Ödenmiş siparişler iptal edilemez. İade işlemi için yöneticiyle iletişime geçin.',
      };
    }

    if (order.status === 'cancelled') {
      return {
        success: false,
        message: 'Bu sipariş zaten iptal edilmiş.',
      };
    }

    // Mock iptal
    order.status = 'cancelled';
    console.log(`❌ Sipariş iptal edildi: ${order.orderId} - Sebep: ${params.reason}`);

    return {
      success: true,
      message: `Sipariş ${order.orderId} başarıyla iptal edildi.`,
      orderId: order.orderId,
      reason: params.reason,
      refundAmount: order.total,
      timestamp: new Date().toISOString(),
    };
  }

  private getStatusText(status: string): string {
    const statusMap = {
      pending: '⏳ Bekliyor',
      preparing: '👨‍🍳 Hazırlanıyor',
      ready: '✅ Hazır',
      served: '🍽️ Servis edildi',
      paid: '💰 Ödendi',
      cancelled: '❌ İptal edildi',
    };
    return statusMap[status] || status;
  }
}
