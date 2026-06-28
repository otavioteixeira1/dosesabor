import { formatCurrency } from '../lib/format'
import type { Product } from '../types/store'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isUnavailable = !product.isAvailable || product.stockQuantity <= 0

  return (
    <article className="group overflow-hidden rounded-[30px] border border-[var(--color-line)] bg-white shadow-[0_22px_60px_rgba(18,39,56,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(18,39,56,0.14)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#dff8f7,#fff3ef)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="relative flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_#25c6d8,_#155a76_72%)]">
            <span className="absolute left-6 top-6 h-16 w-16 rounded-full bg-white/10 blur-sm" />
            <span className="absolute bottom-6 right-6 h-20 w-20 rounded-full bg-[var(--color-highlight)]/20 blur-md" />
            <span className="relative font-[Fraunces] text-4xl font-bold text-white">{product.name[0]}</span>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink)]">
          Estoque {product.stockQuantity}
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-[var(--color-ink)]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
          Doce artesanal
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-[Fraunces] text-[1.35rem] font-bold leading-tight text-[var(--color-ink)]">
              {product.name}
            </h3>
            <span className="rounded-full bg-[var(--color-shell)] px-3 py-1 text-base font-bold text-[var(--color-accent-strong)]">
              {formatCurrency(product.price)}
            </span>
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {product.description || 'Doce artesanal preparado com ingredientes selecionados.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={isUnavailable}
          className="w-full rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUnavailable ? 'Indisponivel no momento' : 'Adicionar ao carrinho'}
        </button>
      </div>
    </article>
  )
}
