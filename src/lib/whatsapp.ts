import { PAYMENT_METHOD_LABELS } from './constants'
import { formatCurrency, normalizeWhatsappNumber } from './format'
import type { CartItem, CheckoutFormValues, CheckoutTotals, StoreSettings } from '../types/store'

export function buildWhatsappMessage(
  items: CartItem[],
  checkout: CheckoutFormValues,
  totals: CheckoutTotals,
  settings: StoreSettings,
) {
  const lines = [
    `Olá! Quero fazer um pedido na ${settings.storeName}.`,
    '',
    '*Itens do pedido:*',
    ...items.map((item) => {
      const notes = item.notes ? ` | Obs: ${item.notes}` : ''
      return `- ${item.quantity}x ${item.name} (${formatCurrency(item.unitPrice)})${notes}`
    }),
    '',
    `*Subtotal:* ${formatCurrency(totals.subtotal)}`,
    `*Taxa de entrega:* ${formatCurrency(totals.deliveryFee)}`,
    `*Total:* ${formatCurrency(totals.total)}`,
    '',
    '*Dados do cliente:*',
    `Nome: ${checkout.customerName}`,
    `Telefone: ${checkout.customerPhone}`,
    `Tipo: ${checkout.fulfillmentType === 'entrega' ? 'Entrega' : 'Retirada'}`,
    `Pagamento: ${PAYMENT_METHOD_LABELS[checkout.paymentMethod]}`,
  ]

  if (checkout.fulfillmentType === 'entrega') {
    lines.push(`Endereço: ${checkout.deliveryAddress}`)
    lines.push(`Bairro: ${checkout.neighborhood}`)
  }

  if (checkout.notes) {
    lines.push(`Observações gerais: ${checkout.notes}`)
  }

  if (checkout.paymentMethod === 'pix' && settings.pixKey) {
    lines.push(`Pix para pagamento: ${settings.pixKey}`)
  }

  return lines.join('\n')
}

export function buildWhatsappUrl(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsappNumber(phone)
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
