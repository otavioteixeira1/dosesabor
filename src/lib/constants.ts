import type { CheckoutFormValues, OrderStatus, PaymentMethod, StockMovementType, StoreSettings } from '../types/store'

export const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  storeName: 'Doce Sabor Doceria Gourmet',
  whatsappNumber: '5519999999999',
  pixKey: '',
  deliveryFee: 7,
  minimumOrder: 20,
  isStoreOpen: true,
  openingHours: 'Seg a Sáb, 10h às 20h',
  kioskCity: 'Águas da Prata',
  deliveryCity: 'Poços de Caldas',
  brandTagline: 'Doces artesanais para retirada e delivery',
}

export const DEFAULT_CHECKOUT_VALUES: CheckoutFormValues = {
  customerName: '',
  customerPhone: '',
  fulfillmentType: 'retirada',
  deliveryAddress: '',
  neighborhood: '',
  notes: '',
  paymentMethod: 'pix',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'Pix',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  novo: 'Novo',
  aceito: 'Aceito',
  preparando: 'Preparando',
  pronto: 'Pronto',
  saiu_para_entrega: 'Saiu para entrega',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  entrada_manual: 'Entrada manual',
  saida_manual: 'Saída manual',
  ajuste: 'Ajuste',
  saida_venda: 'Saída por venda',
  reversao_venda: 'Reversão de venda',
}

export const ACCEPTED_ORDER_STATUSES: OrderStatus[] = [
  'aceito',
  'preparando',
  'pronto',
  'saiu_para_entrega',
  'finalizado',
]
