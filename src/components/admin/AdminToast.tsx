import { cn } from '@/lib/utils'

export function AdminToast({
  message,
  tipo,
}: {
  message: string
  tipo: 'ok' | 'err'
}) {
  if (!message) return null
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-[12px] text-white max-w-sm',
        tipo === 'err' ? 'bg-[var(--danger)]' : 'bg-[var(--acc)]'
      )}
    >
      {message}
    </div>
  )
}
