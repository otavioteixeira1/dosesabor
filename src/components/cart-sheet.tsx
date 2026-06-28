import { PAYMENT_METHOD_LABELS } from '../lib/constants'
import { formatCurrency, formatPhoneInput } from '../lib/format'
import type { CartItem, CheckoutFormValues, CheckoutTotals, StoreSettings } from '../types/store'

type CartSheetProps = {
  isOpen: boolean
  items: CartItem[]
  checkout: CheckoutFormValues
  totals: CheckoutTotals
  settings: StoreSettings
  isSubmitting: boolean
  errorMessage: string
  successMessage: string
  onClose: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdateNotes: (productId: string, notes: string) => void
  onChangeCheckout: (values: CheckoutFormValues) => void
  onSubmit: () => Promise<void>
}

export function CartSheet({
  isOpen,
  items,
  checkout,
  totals,
  settings,
  isSubmitting,
  errorMessage,
  successMessage,
  onClose,
  onUpdateQuantity,
  onUpdateNotes,
  onChangeCheckout,
  onSubmit,
}: CartSheetProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/45 transition ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-[0_-20px_60px_rgba(15,23,42,0.28)] transition ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } lg:left-auto lg:w-[420px] lg:rounded-l-[32px] lg:rounded-r-none`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[Fraunces] text-2xl font-bold text-[var(--color-ink)]">Seu carrinho</h2>
            <p className="text-sm text-[var(--color-muted)]">Finalize por WhatsApp com pedido salvo no painel.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--color-shell)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)]"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
              Seu carrinho está vazio.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="rounded-[24px] border border-[var(--color-line)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">{item.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{formatCurrency(item.unitPrice)} cada</p>
                  </div>
                  <p className="font-semibold text-[var(--color-accent)]">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    className="h-9 w-9 rounded-full bg-[var(--color-shell)] text-lg font-bold text-[var(--color-ink)]"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center font-semibold text-[var(--color-ink)]">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    className="h-9 w-9 rounded-full bg-[var(--color-shell)] text-lg font-bold text-[var(--color-ink)]"
                  >
                    +
                  </button>
                </div>
                <label className="mt-3 block text-sm font-medium text-[var(--color-ink)]">
                  Observação do item
                  <textarea
                    value={item.notes}
                    onChange={(event) => onUpdateNotes(item.productId, event.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-line)] px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400"
                    placeholder="Ex.: sem cobertura, mais morango..."
                  />
                </label>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 space-y-4 rounded-[28px] bg-[var(--color-shell)] p-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChangeCheckout({ ...checkout, fulfillmentType: 'retirada' })}
              className={`rounded-full px-4 py-3 text-sm font-semibold ${
                checkout.fulfillmentType === 'retirada'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-white text-[var(--color-ink)]'
              }`}
            >
              Retirada
            </button>
            <button
              type="button"
              onClick={() => onChangeCheckout({ ...checkout, fulfillmentType: 'entrega' })}
              className={`rounded-full px-4 py-3 text-sm font-semibold ${
                checkout.fulfillmentType === 'entrega'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-white text-[var(--color-ink)]'
              }`}
            >
              Entrega
            </button>
          </div>

          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Nome
            <input
              value={checkout.customerName}
              onChange={(event) => onChangeCheckout({ ...checkout, customerName: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 outline-none"
              placeholder="Seu nome"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Telefone
            <input
              value={checkout.customerPhone}
              onChange={(event) =>
                onChangeCheckout({ ...checkout, customerPhone: formatPhoneInput(event.target.value) })
              }
              className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 outline-none"
              placeholder="(19) 99999-9999"
            />
          </label>

          {checkout.fulfillmentType === 'entrega' ? (
            <>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Endereço
                <input
                  value={checkout.deliveryAddress}
                  onChange={(event) => onChangeCheckout({ ...checkout, deliveryAddress: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 outline-none"
                  placeholder="Rua, número e complemento"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Bairro
                <input
                  value={checkout.neighborhood}
                  onChange={(event) => onChangeCheckout({ ...checkout, neighborhood: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 outline-none"
                  placeholder="Seu bairro"
                />
              </label>
            </>
          ) : null}

          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Forma de pagamento
            <select
              value={checkout.paymentMethod}
              onChange={(event) =>
                onChangeCheckout({
                  ...checkout,
                  paymentMethod: event.target.value as CheckoutFormValues['paymentMethod'],
                })
              }
              className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 outline-none"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Observações gerais
            <textarea
              value={checkout.notes}
              onChange={(event) => onChangeCheckout({ ...checkout, notes: event.target.value })}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 outline-none"
              placeholder="Informações para o pedido ou entrega"
            />
          </label>

          <div className="rounded-[24px] bg-white p-4">
            <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-muted)]">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(totals.deliveryFee)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-bold text-[var(--color-ink)]">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
              Pedido mínimo: {formatCurrency(settings.minimumOrder)}.
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}
          {successMessage ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
          ) : null}

          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSubmitting || items.length === 0}
            className="w-full rounded-full bg-[var(--color-highlight)] px-4 py-4 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Enviando pedido...' : 'Finalizar pelo WhatsApp'}
          </button>
        </div>
      </aside>
    </div>
  )
}
