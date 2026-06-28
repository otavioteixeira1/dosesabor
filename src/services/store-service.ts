import { DEFAULT_SETTINGS } from '../lib/constants'
import { slugify } from '../lib/format'
import { requireSupabase } from '../lib/supabase'
import type {
  CashMovement,
  Category,
  CategoryInput,
  CheckoutFormValues,
  DashboardSummary,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  PublicCatalog,
  StoreSettings,
  TopProduct,
  CartItem,
  StockMovement,
  StockMovementType,
} from '../types/store'

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    categoryId: row.category_id ? String(row.category_id) : null,
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    price: Number(row.price ?? 0),
    imageUrl: row.image_url ? String(row.image_url) : null,
    isActive: Boolean(row.is_active),
    isAvailable: Boolean(row.is_available),
    stockQuantity: Number(row.stock_quantity ?? 0),
    displayOrder: Number(row.display_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapOrder(row: Record<string, unknown>): Order {
  const items = Array.isArray(row.order_items)
    ? row.order_items.map((item) => ({
        id: String(item.id),
        orderId: String(item.order_id),
        productId: item.product_id ? String(item.product_id) : null,
        productName: String(item.product_name),
        unitPrice: Number(item.unit_price ?? 0),
        quantity: Number(item.quantity ?? 0),
        lineTotal: Number(item.line_total ?? 0),
        notes: item.notes ? String(item.notes) : null,
      }))
    : []

  return {
    id: String(row.id),
    orderCode: String(row.order_code),
    status: row.status as OrderStatus,
    fulfillmentType: row.fulfillment_type as Order['fulfillmentType'],
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    deliveryAddress: row.delivery_address ? String(row.delivery_address) : null,
    neighborhood: row.neighborhood ? String(row.neighborhood) : null,
    notes: row.notes ? String(row.notes) : null,
    paymentMethod: row.payment_method as Order['paymentMethod'],
    subtotal: Number(row.subtotal ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    total: Number(row.total ?? 0),
    whatsappMessage: String(row.whatsapp_message ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
    finalizedAt: row.finalized_at ? String(row.finalized_at) : null,
    items,
  }
}

function mapSettings(row?: Record<string, unknown> | null): StoreSettings {
  if (!row) return DEFAULT_SETTINGS

  return {
    id: Number(row.id ?? 1),
    storeName: String(row.store_name ?? DEFAULT_SETTINGS.storeName),
    whatsappNumber: String(row.whatsapp_number ?? DEFAULT_SETTINGS.whatsappNumber),
    pixKey: row.pix_key ? String(row.pix_key) : null,
    deliveryFee: Number(row.delivery_fee ?? DEFAULT_SETTINGS.deliveryFee),
    minimumOrder: Number(row.minimum_order ?? DEFAULT_SETTINGS.minimumOrder),
    isStoreOpen: Boolean(row.is_store_open ?? DEFAULT_SETTINGS.isStoreOpen),
    openingHours: String(row.opening_hours ?? DEFAULT_SETTINGS.openingHours),
    kioskCity: String(row.kiosk_city ?? DEFAULT_SETTINGS.kioskCity),
    deliveryCity: String(row.delivery_city ?? DEFAULT_SETTINGS.deliveryCity),
    brandTagline: String(row.brand_tagline ?? DEFAULT_SETTINGS.brandTagline),
  }
}

function mapCashMovement(row: Record<string, unknown>): CashMovement {
  return {
    id: String(row.id),
    movementType: row.movement_type as CashMovement['movementType'],
    amount: Number(row.amount ?? 0),
    paymentMethod: row.payment_method ? (row.payment_method as CashMovement['paymentMethod']) : null,
    description: row.description ? String(row.description) : null,
    orderId: row.order_id ? String(row.order_id) : null,
    movementDate: String(row.movement_date),
    createdAt: String(row.created_at),
  }
}

function mapStockMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    movementType: row.movement_type as StockMovementType,
    quantity: Number(row.quantity ?? 0),
    reason: row.reason ? String(row.reason) : null,
    orderId: row.order_id ? String(row.order_id) : null,
    createdAt: String(row.created_at),
  }
}

async function uploadProductImage(file: File, slug: string) {
  const client = requireSupabase()
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `products/${Date.now()}-${slug}.${extension}`
  const { error } = await client.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Falha no upload da imagem: ${error.message}`)
  }

  const { data } = client.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

export async function fetchPublicCatalog(): Promise<PublicCatalog> {
  const client = requireSupabase()
  const [{ data: categories, error: categoryError }, { data: products, error: productError }, { data: settings, error: settingsError }] =
    await Promise.all([
      client.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true)
        .order('display_order', { ascending: true }),
      client.from('settings').select('*').limit(1).maybeSingle(),
    ])

  if (categoryError) throw new Error(categoryError.message)
  if (productError) throw new Error(productError.message)
  if (settingsError) throw new Error(settingsError.message)

  return {
    categories: (categories ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    products: (products ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
    settings: mapSettings(settings as Record<string, unknown> | null),
  }
}

export async function fetchAdminData() {
  const client = requireSupabase()
  const [
    { data: categories, error: categoryError },
    { data: products, error: productError },
    { data: orders, error: orderError },
    { data: settings, error: settingsError },
    { data: cash, error: cashError },
    { data: stock, error: stockError },
  ] = await Promise.all([
    client.from('categories').select('*').order('sort_order', { ascending: true }),
    client.from('products').select('*').order('display_order', { ascending: true }),
    client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(50),
    client.from('settings').select('*').limit(1).maybeSingle(),
    client.from('cash_movements').select('*').order('created_at', { ascending: false }).limit(50),
    client.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  if (categoryError) throw new Error(categoryError.message)
  if (productError) throw new Error(productError.message)
  if (orderError) throw new Error(orderError.message)
  if (settingsError) throw new Error(settingsError.message)
  if (cashError) throw new Error(cashError.message)
  if (stockError) throw new Error(stockError.message)

  return {
    categories: (categories ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    products: (products ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
    orders: (orders ?? []).map((row) => mapOrder(row as Record<string, unknown>)),
    settings: mapSettings(settings as Record<string, unknown> | null),
    cashMovements: (cash ?? []).map((row) => mapCashMovement(row as Record<string, unknown>)),
    stockMovements: (stock ?? []).map((row) => mapStockMovement(row as Record<string, unknown>)),
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const client = requireSupabase()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

  const [{ data: orders, error: orderError }, { data: cash, error: cashError }] = await Promise.all([
    client
      .from('orders')
      .select('total, created_at, status, order_items(product_name, quantity, line_total)')
      .gte('created_at', start),
    client.from('cash_movements').select('amount, movement_type, movement_date').eq('movement_date', start.slice(0, 10)),
  ])

  if (orderError) throw new Error(orderError.message)
  if (cashError) throw new Error(cashError.message)

  const orderRows = (orders ?? []) as Array<Record<string, unknown>>
  const completedOrders = orderRows.filter((order) => order.status !== 'cancelado')
  const sales = completedOrders.reduce((total, order) => total + Number(order.total ?? 0), 0)
  const topProductMap = new Map<string, TopProduct>()

  completedOrders.forEach((order) => {
    const items = Array.isArray(order.order_items) ? order.order_items : []
    items.forEach((item) => {
      const key = String(item.product_name)
      const current = topProductMap.get(key)
      const quantity = Number(item.quantity ?? 0)
      const revenue = Number(item.line_total ?? 0)
      topProductMap.set(key, {
        productName: key,
        quantity: (current?.quantity ?? 0) + quantity,
        revenue: (current?.revenue ?? 0) + revenue,
      })
    })
  })

  const cashBalance = ((cash ?? []) as Array<Record<string, unknown>>).reduce((total, movement) => {
    const amount = Number(movement.amount ?? 0)
    if (movement.movement_type === 'saida_despesa') return total - amount
    if (movement.movement_type === 'fechamento') return total
    return total + amount
  }, 0)

  return {
    metrics: [
      { label: 'Vendas do dia', value: `R$ ${sales.toFixed(2).replace('.', ',')}`, helper: 'Pedidos ativos do dia' },
      { label: 'Pedidos', value: String(completedOrders.length), helper: 'Novos pedidos recebidos hoje' },
      { label: 'Caixa do dia', value: `R$ ${cashBalance.toFixed(2).replace('.', ',')}`, helper: 'Entradas menos saídas' },
    ],
    topProducts: Array.from(topProductMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  }
}

export async function createOrder(input: {
  items: CartItem[]
  checkout: CheckoutFormValues
  subtotal: number
  deliveryFee: number
  total: number
  whatsappMessage: string
}) {
  const client = requireSupabase()

  const orderPayload = {
    status: 'novo',
    fulfillment_type: input.checkout.fulfillmentType,
    customer_name: input.checkout.customerName,
    customer_phone: input.checkout.customerPhone,
    delivery_address: input.checkout.deliveryAddress || null,
    neighborhood: input.checkout.neighborhood || null,
    notes: input.checkout.notes || null,
    payment_method: input.checkout.paymentMethod,
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
    whatsapp_message: input.whatsappMessage,
  }

  const { data: order, error: orderError } = await client.from('orders').insert(orderPayload).select().single()

  if (orderError) throw new Error(orderError.message)

  const itemPayload = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.name,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    line_total: item.unitPrice * item.quantity,
    notes: item.notes || null,
  }))

  const { error: itemError } = await client.from('order_items').insert(itemPayload)

  if (itemError) {
    await client.from('orders').delete().eq('id', order.id)
    throw new Error(itemError.message)
  }

  return order.id as string
}

export async function saveCategory(input: CategoryInput) {
  const client = requireSupabase()
  const payload = {
    name: input.name,
    slug: slugify(input.name),
    description: input.description || null,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  }

  const query = input.id
    ? client.from('categories').update(payload).eq('id', input.id)
    : client.from('categories').insert(payload)

  const { error } = await query
  if (error) throw new Error(error.message)
}

export async function deleteCategory(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveProduct(input: ProductInput, imageFile?: File | null) {
  const client = requireSupabase()
  const slug = slugify(input.name)
  let imageUrl = input.imageUrl ?? null

  if (imageFile) {
    imageUrl = await uploadProductImage(imageFile, slug)
  }

  const payload = {
    category_id: input.categoryId,
    name: input.name,
    slug,
    description: input.description || null,
    price: input.price,
    image_url: imageUrl,
    is_active: input.isActive,
    is_available: input.isAvailable,
    stock_quantity: input.stockQuantity,
    display_order: input.displayOrder,
  }

  const query = input.id
    ? client.from('products').update(payload).eq('id', input.id)
    : client.from('products').insert(payload)

  const { error } = await query
  if (error) throw new Error(error.message)
}

export async function deleteProduct(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const client = requireSupabase()
  const { error } = await client.from('orders').update({ status }).eq('id', orderId)
  if (error) throw new Error(error.message)
}

export async function addStockMovement(input: {
  productId: string
  movementType: StockMovementType
  quantity: number
  reason: string
}) {
  const client = requireSupabase()
  const { data: product, error: productError } = await client
    .from('products')
    .select('stock_quantity')
    .eq('id', input.productId)
    .single()

  if (productError) throw new Error(productError.message)

  const currentStock = Number(product.stock_quantity ?? 0)
  const delta =
    input.movementType === 'entrada_manual'
      ? input.quantity
      : input.movementType === 'saida_manual'
        ? -input.quantity
        : input.quantity

  const nextStock = Math.max(currentStock + delta, 0)

  const { error: stockError } = await client
    .from('products')
    .update({ stock_quantity: nextStock })
    .eq('id', input.productId)

  if (stockError) throw new Error(stockError.message)

  const { error: movementError } = await client.from('stock_movements').insert({
    product_id: input.productId,
    movement_type: input.movementType,
    quantity: input.quantity,
    reason: input.reason || null,
  })

  if (movementError) throw new Error(movementError.message)
}

export async function saveSettings(settings: StoreSettings) {
  const client = requireSupabase()
  const payload = {
    id: 1,
    store_name: settings.storeName,
    whatsapp_number: settings.whatsappNumber,
    pix_key: settings.pixKey || null,
    delivery_fee: settings.deliveryFee,
    minimum_order: settings.minimumOrder,
    is_store_open: settings.isStoreOpen,
    opening_hours: settings.openingHours,
    kiosk_city: settings.kioskCity,
    delivery_city: settings.deliveryCity,
    brand_tagline: settings.brandTagline,
  }

  const { error } = await client.from('settings').upsert(payload)
  if (error) throw new Error(error.message)
}

export async function addCashMovement(input: {
  movementType: CashMovement['movementType']
  amount: number
  description: string
  paymentMethod: CashMovement['paymentMethod']
}) {
  const client = requireSupabase()
  const { error } = await client.from('cash_movements').insert({
    movement_type: input.movementType,
    amount: input.amount,
    description: input.description || null,
    payment_method: input.paymentMethod,
  })

  if (error) throw new Error(error.message)
}

export async function closeCashDay(amount: number) {
  const client = requireSupabase()
  const { error } = await client.from('cash_movements').insert({
    movement_type: 'fechamento',
    amount,
    description: 'Fechamento diário do caixa',
  })

  if (error) throw new Error(error.message)
}
