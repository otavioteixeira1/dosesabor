export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_18px_36px_rgba(19,61,86,0.16)]">
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#20bfd0_0deg,#0e7f9b_160deg,#113a59_260deg,#e24a3a_340deg,#20bfd0_360deg)]" />
        <span className="absolute inset-[3px] rounded-full bg-[var(--color-accent-strong)]" />
        <span className="absolute inset-[7px] rounded-full border border-white/55" />
        <span className="absolute inset-[10px] rounded-full border border-white/30" />
        <span className="relative font-[Fraunces] text-lg font-bold tracking-[0.08em] text-white">DS</span>
      </div>
      <div>
        <p className="font-[Fraunces] text-xl font-bold leading-none tracking-[-0.02em] text-[var(--color-ink)]">
          Doce Sabor
        </p>
        {!compact ? (
          <p className="text-sm font-medium tracking-[0.04em] text-[var(--color-highlight)]">Doceria Gourmet</p>
        ) : null}
      </div>
    </div>
  )
}
