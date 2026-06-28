export function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
        isOpen
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-rose-100 text-rose-700'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}
      />
      {isOpen ? 'Loja aberta' : 'Loja fechada'}
    </span>
  )
}
