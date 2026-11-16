import { AlertTriangle } from 'lucide-react'

export function ErrorBox({ message = 'Erro ao carregar dados.' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 bg-[var(--danger-bg)] border border-red-200 rounded-xl px-4 py-3 text-sm text-[var(--danger)]">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
