export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-accent)] shadow-[0_12px_30px_rgba(9,128,156,0.22)]">
        <span className="absolute inset-1 rounded-[14px] border border-white/40" />
        <span className="font-[Fraunces] text-xl font-bold text-white">DS</span>
      </div>
      <div>
        <p className="font-[Fraunces] text-xl font-bold leading-none text-[var(--color-ink)]">
          Doce Sabor
        </p>
        {!compact ? (
          <p className="text-sm text-[var(--color-muted)]">Doceria Gourmet</p>
        ) : null}
      </div>
    </div>
  )
}
