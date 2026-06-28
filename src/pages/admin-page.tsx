import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { AdminShell } from '../components/admin-shell'
import { useAuth } from '../context/auth-context'
import { DEFAULT_SETTINGS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, STOCK_MOVEMENT_LABELS } from '../lib/constants'
import { formatCurrency, formatDate, formatDateTime } from '../lib/format'
import { requireSupabase } from '../lib/supabase'
import {
  addCashMovement,
  addStockMovement,
  closeCashDay,
  deleteCategory,
  deleteProduct,
  fetchAdminData,
  fetchDashboardSummary,
  saveCategory,
  saveProduct,
  saveSettings,
  updateOrderStatus,
} from '../services/store-service'
import type { CashMovement, Category, DashboardSummary, Order, Product, StockMovement, StoreSettings } from '../types/store'

type AdminData = {
  categories: Category[]
  products: Product[]
  orders: Order[]
  settings: StoreSettings
  cashMovements: CashMovement[]
  stockMovements: StockMovement[]
}

const emptyDashboard: DashboardSummary = {
  metrics: [],
  topProducts: [],
}

export function AdminPage() {
  const { session, isLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'dashboard'
  const [data, setData] = useState<AdminData>({
    categories: [],
    products: [],
    orders: [],
    settings: DEFAULT_SETTINGS,
    cashMovements: [],
    stockMovements: [],
  })
  const [dashboard, setDashboard] = useState<DashboardSummary>(emptyDashboard)
  const [isRefreshing, setIsRefreshing] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<File | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  })
  const [productForm, setProductForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    isActive: true,
    isAvailable: true,
    stockQuantity: 0,
    displayOrder: 0,
    imageUrl: '',
  })
  const [stockForm, setStockForm] = useState({
    productId: '',
    movementType: 'entrada_manual',
    quantity: 1,
    reason: '',
  })
  const [cashForm, setCashForm] = useState({
    movementType: 'saida_despesa',
    amount: 0,
    description: '',
    paymentMethod: 'pix',
  })
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (!session) return
    let active = true

    async function loadAdmin() {
      setIsRefreshing(true)
      try {
        const [adminData, dashboardSummary] = await Promise.all([fetchAdminData(), fetchDashboardSummary()])
        if (!active) return
        setData(adminData)
        setSettingsForm(adminData.settings)
        setDashboard(dashboardSummary)
      } catch (error) {
        if (!active) return
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o painel.')
      } finally {
        if (active) setIsRefreshing(false)
      }
    }

    void loadAdmin()

    return () => {
      active = false
    }
  }, [session])

  if (!isLoading && !session) {
    return <Navigate to="/admin/login" replace />
  }

  async function refreshData(message?: string) {
    setErrorMessage('')
    setFeedback('')
    setIsRefreshing(true)

    try {
      const [adminData, dashboardSummary] = await Promise.all([fetchAdminData(), fetchDashboardSummary()])
      setData(adminData)
      setSettingsForm(adminData.settings)
      setDashboard(dashboardSummary)
      if (message) setFeedback(message)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao atualizar os dados.')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleSignOut() {
    try {
      const supabase = requireSupabase()
      await supabase.auth.signOut()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao encerrar a sessão.')
    }
  }

  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!categoryForm.name.trim()) {
      setErrorMessage('Informe o nome da categoria.')
      return
    }

    try {
      await saveCategory({
        id: editingCategoryId ?? undefined,
        name: categoryForm.name,
        description: categoryForm.description,
        isActive: categoryForm.isActive,
        sortOrder: categoryForm.sortOrder,
      })

      setCategoryForm({ name: '', description: '', isActive: true, sortOrder: 0 })
      setEditingCategoryId(null)
      await refreshData('Categoria salva com sucesso.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar a categoria.')
    }
  }

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!productForm.name.trim()) {
      setErrorMessage('Informe o nome do produto.')
      return
    }

    if (!productForm.categoryId) {
      setErrorMessage('Selecione uma categoria.')
      return
    }

    try {
      await saveProduct(
        {
          id: editingProductId ?? undefined,
          categoryId: productForm.categoryId,
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          isActive: productForm.isActive,
          isAvailable: productForm.isAvailable,
          stockQuantity: Number(productForm.stockQuantity),
          displayOrder: Number(productForm.displayOrder),
          imageUrl: productForm.imageUrl || null,
        },
        productImage,
      )

      setProductForm({
        categoryId: '',
        name: '',
        description: '',
        price: 0,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
        displayOrder: 0,
        imageUrl: '',
      })
      setProductImage(null)
      setEditingProductId(null)
      await refreshData('Produto salvo com sucesso.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar o produto.')
    }
  }

  async function handleStockSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stockForm.productId || stockForm.quantity <= 0) {
      setErrorMessage('Selecione o produto e informe uma quantidade válida.')
      return
    }

    try {
      await addStockMovement({
        productId: stockForm.productId,
        movementType: stockForm.movementType as StockMovement['movementType'],
        quantity: Number(stockForm.quantity),
        reason: stockForm.reason,
      })

      setStockForm({ productId: '', movementType: 'entrada_manual', quantity: 1, reason: '' })
      await refreshData('Movimento de estoque registrado.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao registrar o movimento de estoque.')
    }
  }

  async function handleCashSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (cashForm.amount <= 0) {
      setErrorMessage('Informe um valor válido para o caixa.')
      return
    }

    try {
      await addCashMovement({
        movementType: cashForm.movementType as CashMovement['movementType'],
        amount: Number(cashForm.amount),
        description: cashForm.description,
        paymentMethod: cashForm.paymentMethod as CashMovement['paymentMethod'],
      })

      setCashForm({ movementType: 'saida_despesa', amount: 0, description: '', paymentMethod: 'pix' })
      await refreshData('Movimento de caixa registrado.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao registrar o movimento de caixa.')
    }
  }

  async function handleSaveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveSettings(settingsForm)
      await refreshData('Configurações atualizadas.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar as configurações.')
    }
  }

  const cashBalance = data.cashMovements.reduce((total, movement) => {
    if (movement.movementType === 'saida_despesa') return total - movement.amount
    if (movement.movementType === 'fechamento') return total
    return total + movement.amount
  }, 0)

  return (
    <AdminShell
      activeTab={activeTab}
      onTabChange={(tab) => setSearchParams({ tab })}
      onSignOut={handleSignOut}
      settings={data.settings}
    >
      {feedback ? (
        <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}
      {errorMessage ? (
        <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}
      {isRefreshing ? <div className="mb-6 rounded-2xl bg-white px-4 py-3 text-sm text-[var(--color-muted)]">Atualizando painel...</div> : null}

      {activeTab === 'dashboard' ? (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {dashboard.metrics.map((metric) => (
              <article key={metric.label} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">{metric.label}</p>
                <p className="mt-3 font-[Fraunces] text-4xl font-bold text-[var(--color-ink)]">{metric.value}</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{metric.helper}</p>
              </article>
            ))}
          </div>
          <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
            <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">Produtos mais vendidos</h2>
            <div className="mt-4 space-y-3">
              {dashboard.topProducts.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Ainda não há vendas registradas hoje.</p>
              ) : (
                dashboard.topProducts.map((product) => (
                  <div key={product.productName} className="flex items-center justify-between rounded-2xl bg-[var(--color-shell)] px-4 py-3">
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{product.productName}</p>
                      <p className="text-sm text-[var(--color-muted)]">{product.quantity} unidades</p>
                    </div>
                    <p className="font-semibold text-[var(--color-accent)]">{formatCurrency(product.revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'categorias' ? (
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={handleCategorySubmit} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
            <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">
              {editingCategoryId ? 'Editar categoria' : 'Nova categoria'}
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Nome
                <input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Descrição
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Ordem
                <input
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-ink)]">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })}
                />
                Categoria ativa
              </label>
              <button type="submit" className="w-full rounded-full bg-[var(--color-ink)] px-4 py-4 text-sm font-bold text-white">
                Salvar categoria
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {data.categories.map((category) => (
              <article key={category.id} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">{category.name}</h3>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{category.description || 'Sem descrição.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(category.id)
                        setCategoryForm({
                          name: category.name,
                          description: category.description ?? '',
                          isActive: category.isActive,
                          sortOrder: category.sortOrder,
                        })
                      }}
                      className="rounded-full bg-[var(--color-shell)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            await deleteCategory(category.id)
                            await refreshData('Categoria excluída.')
                          } catch (error) {
                            setErrorMessage(error instanceof Error ? error.message : 'Falha ao excluir a categoria.')
                          }
                        })()
                      }}
                      className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'produtos' ? (
        <section className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <form onSubmit={handleProductSubmit} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
              <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">
                {editingProductId ? 'Editar produto' : 'Novo produto'}
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--color-ink)] md:col-span-2">
                  Categoria
                  <select
                    value={productForm.categoryId}
                    onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  >
                    <option value="">Selecione</option>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)] md:col-span-2">
                  Nome
                  <input
                    value={productForm.name}
                    onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)] md:col-span-2">
                  Descrição
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Preço
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) => setProductForm({ ...productForm, price: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Estoque
                  <input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(event) => setProductForm({ ...productForm, stockQuantity: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Ordem de exibição
                  <input
                    type="number"
                    value={productForm.displayOrder}
                    onChange={(event) => setProductForm({ ...productForm, displayOrder: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  URL da imagem
                  <input
                    value={productForm.imageUrl}
                    onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)] md:col-span-2">
                  Upload de imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setProductImage(event.target.files?.[0] ?? null)}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-ink)]">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(event) => setProductForm({ ...productForm, isActive: event.target.checked })}
                  />
                  Produto ativo
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-ink)]">
                  <input
                    type="checkbox"
                    checked={productForm.isAvailable}
                    onChange={(event) => setProductForm({ ...productForm, isAvailable: event.target.checked })}
                  />
                  Disponível
                </label>
              </div>
              <button type="submit" className="mt-5 w-full rounded-full bg-[var(--color-ink)] px-4 py-4 text-sm font-bold text-white">
                Salvar produto
              </button>
            </form>

            <form onSubmit={handleStockSubmit} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
              <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">Movimento de estoque</h2>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Produto
                  <select
                    value={stockForm.productId}
                    onChange={(event) => setStockForm({ ...stockForm, productId: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  >
                    <option value="">Selecione</option>
                    {data.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Tipo
                  <select
                    value={stockForm.movementType}
                    onChange={(event) => setStockForm({ ...stockForm, movementType: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  >
                    {Object.entries(STOCK_MOVEMENT_LABELS)
                      .filter(([key]) => key !== 'saida_venda' && key !== 'reversao_venda')
                      .map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Quantidade
                  <input
                    type="number"
                    value={stockForm.quantity}
                    onChange={(event) => setStockForm({ ...stockForm, quantity: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Motivo
                  <textarea
                    rows={3}
                    value={stockForm.reason}
                    onChange={(event) => setStockForm({ ...stockForm, reason: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
              </div>
              <button type="submit" className="mt-5 w-full rounded-full bg-[var(--color-accent)] px-4 py-4 text-sm font-bold text-white">
                Registrar movimento
              </button>
            </form>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.products.map((product) => (
              <article key={product.id} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                      {data.categories.find((category) => category.id === product.categoryId)?.name ?? 'Sem categoria'}
                    </p>
                    <h3 className="mt-2 font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">{product.name}</h3>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{product.description || 'Sem descrição.'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--color-accent)]">{formatCurrency(product.price)}</p>
                    <p className="text-sm text-[var(--color-muted)]">Estoque: {product.stockQuantity}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(product.id)
                      setProductForm({
                        categoryId: product.categoryId ?? '',
                        name: product.name,
                        description: product.description ?? '',
                        price: product.price,
                        isActive: product.isActive,
                        isAvailable: product.isAvailable,
                        stockQuantity: product.stockQuantity,
                        displayOrder: product.displayOrder,
                        imageUrl: product.imageUrl ?? '',
                      })
                    }}
                    className="rounded-full bg-[var(--color-shell)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        try {
                          await deleteProduct(product.id)
                          await refreshData('Produto excluído.')
                        } catch (error) {
                          setErrorMessage(error instanceof Error ? error.message : 'Falha ao excluir o produto.')
                        }
                      })()
                    }}
                    className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
            <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">Últimos movimentos de estoque</h2>
            <div className="mt-4 space-y-3">
              {data.stockMovements.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Nenhum movimento registrado ainda.</p>
              ) : (
                data.stockMovements.map((movement) => {
                  const product = data.products.find((item) => item.id === movement.productId)
                  return (
                    <div key={movement.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-[var(--color-shell)] px-4 py-3">
                      <div>
                        <p className="font-semibold text-[var(--color-ink)]">
                          {product?.name ?? 'Produto removido'} • {STOCK_MOVEMENT_LABELS[movement.movementType]}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          Quantidade: {movement.quantity} • {formatDateTime(movement.createdAt)}
                        </p>
                        {movement.reason ? <p className="mt-1 text-sm text-[var(--color-muted)]">{movement.reason}</p> : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'pedidos' ? (
        <section className="space-y-4">
          {data.orders.map((order) => (
            <article key={order.id} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">{order.orderCode}</p>
                  <h2 className="mt-2 font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">{order.customerName}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{order.customerPhone} • {formatDateTime(order.createdAt)}</p>
                </div>
                <div className="min-w-[210px]">
                  <select
                    value={order.status}
                    onChange={(event) => {
                      void (async () => {
                        try {
                          await updateOrderStatus(order.id, event.target.value as Order['status'])
                          await refreshData('Status do pedido atualizado.')
                        } catch (error) {
                          setErrorMessage(error instanceof Error ? error.message : 'Falha ao atualizar o pedido.')
                        }
                      })()
                    }}
                    className="w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  >
                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-3 rounded-[24px] bg-[var(--color-shell)] p-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--color-ink)]">{item.quantity}x {item.productName}</p>
                        {item.notes ? <p className="text-sm text-[var(--color-muted)]">Obs: {item.notes}</p> : null}
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-accent)]">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-[24px] border border-[var(--color-line)] p-4">
                  <p className="text-sm text-[var(--color-muted)]">Tipo: {order.fulfillmentType}</p>
                  {order.deliveryAddress ? <p className="text-sm text-[var(--color-muted)]">Endereço: {order.deliveryAddress}</p> : null}
                  {order.neighborhood ? <p className="text-sm text-[var(--color-muted)]">Bairro: {order.neighborhood}</p> : null}
                  <p className="text-sm text-[var(--color-muted)]">Pagamento: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                  <p className="text-sm text-[var(--color-muted)]">Subtotal: {formatCurrency(order.subtotal)}</p>
                  <p className="text-sm text-[var(--color-muted)]">Taxa: {formatCurrency(order.deliveryFee)}</p>
                  <p className="text-base font-bold text-[var(--color-ink)]">Total: {formatCurrency(order.total)}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'caixa' ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <article className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Saldo atual</p>
              <p className="mt-3 font-[Fraunces] text-5xl font-bold text-[var(--color-ink)]">{formatCurrency(cashBalance)}</p>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      await closeCashDay(cashBalance)
                      await refreshData('Fechamento diário registrado.')
                    } catch (error) {
                      setErrorMessage(error instanceof Error ? error.message : 'Falha ao fechar o caixa.')
                    }
                  })()
                }}
                className="mt-5 rounded-full bg-[var(--color-highlight)] px-5 py-3 text-sm font-bold text-white"
              >
                Fechar caixa do dia
              </button>
            </article>

            <form onSubmit={handleCashSubmit} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
              <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">Novo movimento</h2>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Tipo
                  <select
                    value={cashForm.movementType}
                    onChange={(event) => setCashForm({ ...cashForm, movementType: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  >
                    <option value="entrada_manual">Entrada manual</option>
                    <option value="saida_despesa">Saída / despesa</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Valor
                  <input
                    type="number"
                    step="0.01"
                    value={cashForm.amount}
                    onChange={(event) => setCashForm({ ...cashForm, amount: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Forma de pagamento
                  <select
                    value={cashForm.paymentMethod}
                    onChange={(event) => setCashForm({ ...cashForm, paymentMethod: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Descrição
                  <textarea
                    rows={3}
                    value={cashForm.description}
                    onChange={(event) => setCashForm({ ...cashForm, description: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
                  />
                </label>
              </div>
              <button type="submit" className="mt-5 w-full rounded-full bg-[var(--color-ink)] px-4 py-4 text-sm font-bold text-white">
                Registrar no caixa
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {data.cashMovements.map((movement) => (
              <article key={movement.id} className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">{movement.description || movement.movementType}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{formatDate(movement.movementDate)} • {formatDateTime(movement.createdAt)}</p>
                  </div>
                  <p className="font-semibold text-[var(--color-accent)]">{formatCurrency(movement.amount)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'configuracoes' ? (
        <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_30px_rgba(18,39,56,0.08)]">
          <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">Configurações da loja</h2>
          <form onSubmit={handleSaveSettings} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Nome da loja
              <input
                value={settingsForm.storeName}
                onChange={(event) => setSettingsForm({ ...settingsForm, storeName: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              WhatsApp
              <input
                value={settingsForm.whatsappNumber}
                onChange={(event) => setSettingsForm({ ...settingsForm, whatsappNumber: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Chave Pix
              <input
                value={settingsForm.pixKey ?? ''}
                onChange={(event) => setSettingsForm({ ...settingsForm, pixKey: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Taxa de entrega
              <input
                type="number"
                step="0.01"
                value={settingsForm.deliveryFee}
                onChange={(event) => setSettingsForm({ ...settingsForm, deliveryFee: Number(event.target.value) })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Pedido mínimo
              <input
                type="number"
                step="0.01"
                value={settingsForm.minimumOrder}
                onChange={(event) => setSettingsForm({ ...settingsForm, minimumOrder: Number(event.target.value) })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Horário de funcionamento
              <input
                value={settingsForm.openingHours}
                onChange={(event) => setSettingsForm({ ...settingsForm, openingHours: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Cidade do quiosque
              <input
                value={settingsForm.kioskCity}
                onChange={(event) => setSettingsForm({ ...settingsForm, kioskCity: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Cidade de entrega
              <input
                value={settingsForm.deliveryCity}
                onChange={(event) => setSettingsForm({ ...settingsForm, deliveryCity: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-ink)] md:col-span-2">
              Texto de destaque
              <textarea
                rows={3}
                value={settingsForm.brandTagline}
                onChange={(event) => setSettingsForm({ ...settingsForm, brandTagline: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none"
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={settingsForm.isStoreOpen}
                onChange={(event) => setSettingsForm({ ...settingsForm, isStoreOpen: event.target.checked })}
              />
              Loja aberta
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="w-full rounded-full bg-[var(--color-ink)] px-4 py-4 text-sm font-bold text-white">
                Salvar configurações
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </AdminShell>
  )
}
