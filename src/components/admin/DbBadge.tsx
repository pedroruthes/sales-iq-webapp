import { AlertTriangle, Database } from 'lucide-react'

export function DbBadge({ indicador }: { indicador?: string }) {
  if (indicador === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Database className="w-3 h-3" /> Banco OK
      </span>
    )
  }
  if (indicador === 'erro') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3 h-3" /> Banco inacessível
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
      <Database className="w-3 h-3" /> Sem banco
    </span>
  )
}
