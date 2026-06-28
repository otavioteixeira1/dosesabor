import { formatCurrency } from '../lib/format'
import type { Product } from '../types/store'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isUnavailable = !product.isAvailable || product.stockQuantity <= 0

  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-white shadow-[0_20px_45px_rgba(18,39,56,0.08)]">
      <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#dff8f7,#fef0ed)]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_#18b7c7,_#0d4b65)]">
            <span className="font-[Fraunces] text-3xl font-bold text-white">{product.name[0]}</span>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
          Estoque: {product.stockQuantity}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-[Fraunces] text-xl font-bold text-[var(--color-ink)]">{product.name}</h3>
            <span className="text-base font-bold text-[var(--color-accent)]">{formatCurrency(product.price)}</span>
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {product.description || 'Delícia artesanal preparada com ingredientes selecionados.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={isUnavailable}
          className="w-full rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUnavailable ? 'Indisponível no momento' : 'Adicionar ao carrinho'}
        </button>
      </div>
    </article>
  )
}
