import { AlertTriangle } from 'lucide-react'
export function ErrorMessage({ message='Erro ao carregar dados.' }: { message?:string }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-sm text-red-400">
      <AlertTriangle className="w-4 h-4 shrink-0" />{message}
    </div>
  )
}
