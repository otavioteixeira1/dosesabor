export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: string
  categoryId: string | null
  name: string
  slug: string
  description: string | null
  price: number
  imageUrl: string | null
  isActive: boolean
  isAvailable: boolean
  stockQuantity: number
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export type ProductWithCategory = Product & {
  category?: Category | null
}

export type FulfillmentType = 'retirada' | 'entrega'

export type PaymentMethod = 'dinheiro' | 'cartao' | 'pix'

export type OrderStatus =
  | 'novo'
  | 'aceito'
  | 'preparando'
  | 'pronto'
  | 'saiu_para_entrega'
  | 'finalizado'
  | 'cancelado'

export type CartItem = {
  productId: string
  name: string
  unitPrice: number
  quantity: number
  notes: string
  imageUrl: string | null
}

export type CheckoutFormValues = {
  customerName: string
  customerPhone: string
  fulfillmentType: FulfillmentType
  deliveryAddress: string
  neighborhood: string
  notes: string
  paymentMethod: PaymentMethod
}

export type OrderItem = {
  id: string
  orderId: string
  productId: string | null
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
  notes: string | null
}

export type Order = {
  id: string
  orderCode: string
  status: OrderStatus
  fulfillmentType: FulfillmentType
  customerName: string
  customerPhone: string
  deliveryAddress: string | null
  neighborhood: string | null
  notes: string | null
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  total: number
  whatsappMessage: string
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
  finalizedAt: string | null
  items: OrderItem[]
}

export type StoreSettings = {
  id: number
  storeName: string
  whatsappNumber: string
  pixKey: string | null
  deliveryFee: number
  minimumOrder: number
  isStoreOpen: boolean
  openingHours: string
  kioskCity: string
  deliveryCity: string
  brandTagline: string
}

export type PublicCatalog = {
  categories: Category[]
  products: Product[]
  settings: StoreSettings
}

export type DashboardMetric = {
  label: string
  value: string
  helper: string
}

export type TopProduct = {
  productName: string
  quantity: number
  revenue: number
}

export type DashboardSummary = {
  metrics: DashboardMetric[]
  topProducts: TopProduct[]
}

export type ProductInput = {
  id?: string
  categoryId: string | null
  name: string
  description: string
  price: number
  isActive: boolean
  isAvailable: boolean
  stockQuantity: number
  displayOrder: number
  imageUrl?: string | null
}

export type CategoryInput = {
  id?: string
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

export type StockMovementType =
  | 'entrada_manual'
  | 'saida_manual'
  | 'ajuste'
  | 'saida_venda'
  | 'reversao_venda'

export type StockMovement = {
  id: string
  productId: string
  movementType: StockMovementType
  quantity: number
  reason: string | null
  orderId: string | null
  createdAt: string
}

export type CashMovementType = 'entrada_pedido' | 'entrada_manual' | 'saida_despesa' | 'fechamento'

export type CashMovement = {
  id: string
  movementType: CashMovementType
  amount: number
  paymentMethod: PaymentMethod | null
  description: string | null
  orderId: string | null
  movementDate: string
  createdAt: string
}

export type CheckoutTotals = {
  subtotal: number
  deliveryFee: number
  total: number
}
