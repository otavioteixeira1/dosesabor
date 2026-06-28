import { useEffect, useState } from 'react'
import { BrandMark } from '../components/brand-mark'
import { CartSheet } from '../components/cart-sheet'
import { ProductCard } from '../components/product-card'
import { StatusBadge } from '../components/status-badge'
import { useCart } from '../context/cart-context'
import { DEFAULT_CHECKOUT_VALUES, DEFAULT_SETTINGS } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import { loadCheckoutProfile, saveCheckoutProfile } from '../lib/storage'
import { isSupabaseConfigured } from '../lib/supabase'
import { buildWhatsappMessage, buildWhatsappUrl } from '../lib/whatsapp'
import { createOrder, fetchPublicCatalog } from '../services/store-service'
import type { Category, CheckoutFormValues, Product, StoreSettings } from '../types/store'

type CatalogState = {
  categories: Category[]
  products: Product[]
  settings: StoreSettings
}

export function StorefrontPage() {
  const { items, addItem, updateNotes, updateQuantity, clearCart, itemCount } = useCart()
  const [catalog, setCatalog] = useState<CatalogState>({
    categories: [],
    products: [],
    settings: DEFAULT_SETTINGS,
  })
  const [checkout, setCheckout] = useState<CheckoutFormValues>(() => loadCheckoutProfile(DEFAULT_CHECKOUT_VALUES))
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      if (!isSupabaseConfigured) {
        if (!active) return
        setIsLoading(false)
        setErrorMessage('Configure o Supabase para carregar produtos e registrar pedidos no painel.')
        return
      }

      try {
        const data = await fetchPublicCatalog()
        if (!active) return
        setCatalog(data)
      } catch (error) {
        if (!active) return
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o cardápio.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadCatalog()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    saveCheckoutProfile(checkout)
  }, [checkout])

  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  const deliveryFee = checkout.fulfillmentType === 'entrega' ? catalog.settings.deliveryFee : 0
  const total = subtotal + deliveryFee

  async function handleSubmitOrder() {
    setErrorMessage('')
    setSuccessMessage('')

    if (items.length === 0) {
      setErrorMessage('Adicione pelo menos um item ao carrinho.')
      return
    }

    if (!checkout.customerName.trim() || !checkout.customerPhone.trim()) {
      setErrorMessage('Preencha nome e telefone para continuar.')
      return
    }

    if (checkout.fulfillmentType === 'entrega' && (!checkout.deliveryAddress.trim() || !checkout.neighborhood.trim())) {
      setErrorMessage('Informe endereço e bairro para entrega.')
      return
    }

    if (total < catalog.settings.minimumOrder) {
      setErrorMessage(`O pedido mínimo é ${formatCurrency(catalog.settings.minimumOrder)}.`)
      return
    }

    if (!catalog.settings.isStoreOpen) {
      setErrorMessage('A loja está fechada no momento. Abra o WhatsApp apenas se combinado com a equipe.')
      return
    }

    setIsSubmitting(true)

    const whatsappMessage = buildWhatsappMessage(items, checkout, { subtotal, deliveryFee, total }, catalog.settings)
    const whatsappUrl = buildWhatsappUrl(catalog.settings.whatsappNumber, whatsappMessage)
    let syncWarning = ''

    if (isSupabaseConfigured) {
      try {
        await createOrder({
          items,
          checkout,
          subtotal,
          deliveryFee,
          total,
          whatsappMessage,
        })
      } catch (error) {
        syncWarning =
          error instanceof Error
            ? `Pedido enviado no WhatsApp, mas não foi salvo no painel: ${error.message}`
            : 'Pedido enviado no WhatsApp, mas sem sincronizar no painel.'
      }
    } else {
      syncWarning = 'Supabase não configurado: o pedido será enviado apenas pelo WhatsApp.'
    }

    const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    if (!popup) {
      window.location.href = whatsappUrl
    }
    clearCart()
    setCheckout((currentValues) => ({
      ...currentValues,
      notes: '',
    }))
    setSuccessMessage(syncWarning || 'Pedido enviado com sucesso para o WhatsApp da loja.')
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-shell)]">
      <header className="border-b border-[var(--color-line)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <div className="flex items-center gap-3">
              <StatusBadge isOpen={catalog.settings.isStoreOpen} />
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="hidden rounded-full bg-[var(--color-highlight)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(196,55,46,0.24)] sm:inline-flex"
              >
                Carrinho ({itemCount})
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
            <span>{catalog.settings.openingHours}</span>
            <span>Quiosque em {catalog.settings.kioskCity}</span>
            <span>Delivery e retirada em {catalog.settings.deliveryCity}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-6">
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0d4b65_0%,#16a7b6_48%,#f55a4a_100%)] px-5 py-8 text-white shadow-[0_24px_80px_rgba(13,75,101,0.25)]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">Cardápio oficial</p>
              <h1 className="mt-3 max-w-xl font-[Fraunces] text-4xl font-bold leading-tight sm:text-5xl">
                Doces finos, bolo no pote e sobremesas prontas para retirar ou receber em casa.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{catalog.settings.brandTagline}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${catalog.settings.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)]"
                >
                  Falar no WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white"
                >
                  Ver carrinho
                </button>
                <a
                  href="/admin/login"
                  className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white/90"
                >
                  Acesso admin
                </a>
              </div>
            </div>
            <div className="rounded-[28px] bg-white/14 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">Resumo da loja</p>
              <dl className="mt-4 space-y-4">
                <div className="rounded-[24px] bg-white/10 p-4">
                  <dt className="text-sm text-white/70">Pedido mínimo</dt>
                  <dd className="mt-1 font-[Fraunces] text-3xl font-bold">{formatCurrency(catalog.settings.minimumOrder)}</dd>
                </div>
                <div className="rounded-[24px] bg-white/10 p-4">
                  <dt className="text-sm text-white/70">Taxa padrão de entrega</dt>
                  <dd className="mt-1 font-[Fraunces] text-3xl font-bold">{formatCurrency(catalog.settings.deliveryFee)}</dd>
                </div>
                <div className="rounded-[24px] bg-white/10 p-4">
                  <dt className="text-sm text-white/70">Atendimento</dt>
                  <dd className="mt-1 text-lg font-semibold">{catalog.settings.openingHours}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {errorMessage && !successMessage ? (
          <div className="mt-5 rounded-[24px] bg-amber-50 px-4 py-3 text-sm text-amber-700">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="mt-5 rounded-[24px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}

        <section className="mt-8">
          <div className="mb-5 flex flex-wrap gap-3">
            {catalog.categories.map((category) => (
              <a
                key={category.id}
                href={`#categoria-${category.slug}`}
                className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
              >
                {category.name}
              </a>
            ))}
          </div>

          {isLoading ? (
            <div className="rounded-[28px] bg-white px-4 py-14 text-center text-sm text-[var(--color-muted)]">
              Carregando cardápio...
            </div>
          ) : catalog.categories.length === 0 ? (
            <div className="rounded-[28px] bg-white px-4 py-14 text-center text-sm text-[var(--color-muted)]">
              Nenhuma categoria publicada ainda.
            </div>
          ) : (
            <div className="space-y-10">
              {catalog.categories.map((category) => {
                const products = catalog.products.filter((product) => product.categoryId === category.id)
                if (products.length === 0) return null

                return (
                  <section key={category.id} id={`categoria-${category.slug}`} className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                          {category.name}
                        </p>
                        <h2 className="font-[Fraunces] text-3xl font-bold text-[var(--color-ink)]">
                          {category.description || 'Seleção artesanal do dia'}
                        </h2>
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAdd={(nextProduct) => {
                            addItem(nextProduct)
                            setIsCartOpen(true)
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-40 rounded-full bg-[var(--color-highlight)] px-5 py-4 text-sm font-bold text-white shadow-[0_24px_48px_rgba(196,55,46,0.24)] sm:hidden"
      >
        Abrir carrinho ({itemCount}) • {formatCurrency(total)}
      </button>

      <CartSheet
        isOpen={isCartOpen}
        items={items}
        checkout={checkout}
        totals={{ subtotal, deliveryFee, total }}
        settings={catalog.settings}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onUpdateNotes={updateNotes}
        onChangeCheckout={setCheckout}
        onSubmit={handleSubmitOrder}
      />
    </div>
  )
}
